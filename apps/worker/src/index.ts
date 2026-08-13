import { Worker } from 'bullmq';
import Redis from 'ioredis';
import { env } from '@danta/config';
import prisma from '@danta/database';
import { LoginAttemptCleanupService } from './services/login-attempt-cleanup.service';
import { SmtpEmailProvider } from './providers/smtp-email.provider';
import { MockSmsProvider } from './providers/mock-sms.provider';
import { EmailMessage, SmsMessage } from './providers/communication-provider.interface';
import cron from 'node-cron';

const connection = new Redis(env.redisUrl, { maxRetriesPerRequest: null });
const emailProvider = new SmtpEmailProvider();
const smsProvider = new MockSmsProvider();

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

async function main() {
  const cleanupService = new LoginAttemptCleanupService();

  const worker = new Worker('danta', async (job) => {
    console.log(`Processing job ${job.id} of type ${job.name}`);

    if (job.name === 'dispatch:message') {
      const messageId = job.data.messageId as string;
      return await dispatchMessage(messageId);
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

  cron.schedule('0 2 * * *', async () => {
    try {
      await cleanupService.cleanupExpiredLoginAttempts();
    } catch (error) {
      console.error('LoginAttempt cleanup failed:', error);
    }
  });

  process.on('SIGINT', async () => {
    await worker.close();
    await connection.quit();
    await prisma.$disconnect();
    process.exit(0);
  });
}

main().catch((error) => {
  console.error('Worker failed to start:', error);
  process.exit(1);
});
