import { Worker } from 'bullmq';
import { createRedisConnection } from './redis';
import prisma from '@danta/database';
import { LoginAttemptCleanupService } from './services/login-attempt-cleanup.service';
import { getEmailProvider, getSmsProvider } from './providers/sms.factory';
import { EmailMessage, SmsMessage } from './providers/communication-provider.interface';
import { createEmailWorker } from './queues/email.queue';
import { createSmsWorker } from './queues/sms.queue';
import { createRemindersWorker } from './queues/reminders.queue';
import { createReportsWorker } from './queues/reports.queue';
import { createImagingWorker } from './queues/imaging.queue';
import { createRecallsWorker, startRecallScheduler } from './queues/recalls.queue';
import cron from 'node-cron';
import { findCompatibleEntries, type WaitlistEntryLike } from '@danta/database';

const connection = createRedisConnection();
const emailProvider = getEmailProvider();
const smsProvider = getSmsProvider();

const workers: Worker[] = [];

async function dispatchMessage(messageId: string): Promise<boolean> {
  const message = await prisma.message.findFirst({
    where: { id: messageId },
  });

  if (!message) {
    console.error(`Message ${messageId} not found`);
    return false;
  }

  if (message.status === 'sent' || message.status === 'delivered' || message.status === 'read') {
    return true;
  }

  if (message.status === 'failed') {
    console.warn(`Message ${messageId} already failed, skipping`);
    return false;
  }

  if (message.patientId) {
    const preferences = await prisma.communicationPreference.findFirst({
      where: { tenantId: message.tenantId, patientId: message.patientId },
    });

    if (preferences) {
      if (message.channel === 'email' && !preferences.emailEnabled) {
        console.warn(`Email disabled for patient ${message.patientId}, skipping message ${messageId}`);
        return false;
      }
      if (message.channel === 'sms' && !preferences.smsEnabled) {
        console.warn(`SMS disabled for patient ${message.patientId}, skipping message ${messageId}`);
        return false;
      }
    }
  }

  let result;
  if (message.channel === 'email') {
    const emailMessage: EmailMessage = {
      to: message.recipient,
      subject: message.subject || '',
      body: message.body,
      patientId: message.patientId || undefined,
      tenantId: message.tenantId,
    };
    result = await emailProvider.sendEmail(emailMessage);
  } else if (message.channel === 'sms') {
    const smsMessage: SmsMessage = {
      to: message.recipient,
      body: message.body,
      patientId: message.patientId || undefined,
      tenantId: message.tenantId,
    };
    result = await smsProvider.sendSms(smsMessage);
  } else {
    console.warn(`Unsupported channel: ${message.channel}`);
    return false;
  }

  if (result.success) {
    await prisma.message.update({
      where: { id: messageId },
      data: {
        status: 'sent',
        provider: result.provider,
        externalId: result.externalId,
        sentAt: new Date(),
      },
    });
    return true;
  } else {
    await prisma.message.update({
      where: { id: messageId },
      data: {
        status: 'failed',
        provider: result.provider,
        error: result.error,
      },
    });
    return false;
  }
}

async function matchWaitlist(tenantId: string, appointmentId: string): Promise<boolean> {
  const appointment = await prisma.appointment.findFirst({
    where: { id: appointmentId, tenantId },
    select: {
      id: true, patientId: true, providerId: true, chairId: true,
      appointmentTypeId: true, startTime: true, endTime: true, status: true,
    },
  });
  if (!appointment || appointment.status !== 'cancelled') return false;

  const entries = await prisma.waitlist.findMany({
    where: { tenantId, status: 'waiting' },
  });

  const matches = findCompatibleEntries(
    {
      providerId: appointment.providerId,
      chairId: appointment.chairId,
      appointmentTypeId: appointment.appointmentTypeId || null,
      startTime: appointment.startTime,
      endTime: appointment.endTime,
    },
    entries,
  );

  for (const match of matches) {
    await prisma.notification.create({
      data: {
        tenantId,
        patientId: match.patientId,
        type: 'system',
        title: 'Earlier slot available',
        message: `A cancellation freed a slot that fits a waitlist entry (preferred ${match.preferredStartTime.toLocaleString('en-AU')} – ${match.preferredEndTime.toLocaleString('en-AU')}). Contact the patient to offer the time.`,
        data: { waitlistEntryId: match.id, freedAppointmentId: appointmentId, suggestedStart: appointment.startTime.toISOString(), suggestedEnd: appointment.endTime.toISOString() },
      },
    });
  }

  await prisma.auditLog.create({
    data: {
      tenantId,
      userId: null as unknown as string,
      action: 'waitlist.match_found',
      resourceType: 'waitlist',
      resourceId: appointmentId,
      result: 'success',
      metadata: { matchedCount: matches.length, matchedEntryIds: matches.map((m: WaitlistEntryLike) => m.id) },
    } as never,
  }).catch(() => undefined);

  console.log(`Waitlist matcher: ${matches.length} compatible entr${matches.length === 1 ? 'y' : 'ies'} for cancelled appointment ${appointmentId}`);
  return matches.length > 0;
}

async function main() {
  const cleanupService = new LoginAttemptCleanupService();

  const worker = new Worker('danta', async (job) => {
    console.log(`Processing job ${job.id} of type ${job.name}`);

    if (job.name === 'dispatch:message') {
      const messageId = job.data.messageId as string;
      return await dispatchMessage(messageId);
    }

    if (job.name === 'match-waitlist') {
      const tenantId = job.data.tenantId as string;
      const appointmentId = job.data.appointmentId as string;
      return await matchWaitlist(tenantId, appointmentId);
    }

    console.log(`Unknown job type: ${job.name}`);
    return false;
  }, { connection });

  worker.on('completed', (job) => {
    console.log(`Job ${job.id} completed`);
  });

  worker.on('failed', (job, err) => {
    console.error(`Job ${job?.id} failed:`, err);
  });

  workers.push(worker);
  workers.push(createEmailWorker());
  workers.push(createSmsWorker());
  workers.push(createRemindersWorker());
  workers.push(createReportsWorker());
  workers.push(createImagingWorker());
  workers.push(createRecallsWorker());
  startRecallScheduler();

  cron.schedule('0 2 * * *', async () => {
    try {
      await cleanupService.cleanupExpiredLoginAttempts();
    } catch (error) {
      console.error('LoginAttempt cleanup failed:', error);
    }
  });

  const shutdown = async (signal: string) => {
    console.log(`${signal} received, closing workers...`);
    await Promise.all(workers.map(w => w.close()));
    await connection.quit();
    await prisma.$disconnect();
    process.exit(0);
  };

  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));
}

main().catch((error) => {
  console.error('Worker failed to start:', error);
  process.exit(1);
});
