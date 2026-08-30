import { Queue, Worker } from 'bullmq';
import { createRedisConnection } from '../redis';
import prisma from '@danta/database';
import { getEmailProvider, getSmsProvider } from '../providers/sms.factory';

const connection = createRedisConnection();
const emailProvider = getEmailProvider();
const smsProvider = getSmsProvider();

export const remindersQueue = new Queue('reminders', {
  connection,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 1000,
    },
  },
});

const DEAD_LETTER_QUEUE = 'dead-letter-reminders';

async function processReminderJob(job: any): Promise<{ status: string }> {
  const { reminderId } = job.data as { reminderId: string };

  const reminder = await prisma.appointmentReminder.findFirst({
    where: { id: reminderId },
  });

  if (!reminder) {
    throw new Error(`Appointment reminder ${reminderId} not found`);
  }

  if (reminder.status === 'sent' || reminder.status === 'delivered') {
    return { status: 'already_processed' };
  }

  const appointment = await prisma.appointment.findFirst({
    where: { id: reminder.appointmentId },
    include: {
      patient: true,
      provider: true,
    },
  });

  if (!appointment) {
    throw new Error(`Appointment not found for reminder ${reminderId}`);
  }

  const patient = appointment.patient;
  const message = `Reminder: You have an appointment on ${appointment.startTime.toLocaleString()} with ${appointment.provider.firstName} ${appointment.provider.lastName}.`;

  let result;
  if (reminder.channel === 'email') {
    result = await emailProvider.sendEmail({
      to: patient.email || '',
      subject: 'Appointment Reminder',
      body: message,
      patientId: patient.id,
      tenantId: reminder.tenantId,
    });
  } else {
    result = await smsProvider.sendSms({
      to: patient.phone || '',
      body: message,
      patientId: patient.id,
      tenantId: reminder.tenantId,
    });
  }

  if (result.success) {
    await prisma.appointmentReminder.update({
      where: { id: reminderId },
      data: {
        status: 'sent',
        sentAt: new Date(),
      },
    });
    return { status: 'sent' };
  } else {
    await prisma.appointmentReminder.update({
      where: { id: reminderId },
      data: {
        status: 'failed',
        error: result.error,
      },
    });
    throw new Error(result.error || 'Reminder send failed');
  }
}

async function processRecallJob(job: any): Promise<{ status: string }> {
  const { recallId } = job.data as { recallId: string };

  const recall = await prisma.recall.findFirst({
    where: { id: recallId },
  });

  if (!recall) {
    throw new Error(`Recall ${recallId} not found`);
  }

  if (recall.status === 'booked' || recall.status === 'completed' || recall.status === 'cancelled') {
    return { status: 'already_processed' };
  }

  const patient = await prisma.patient.findFirst({
    where: { id: recall.patientId },
  });

  if (!patient) {
    throw new Error(`Patient not found for recall ${recallId}`);
  }

  const message = `You are due for a ${recall.type} recall. Please contact us to schedule an appointment.`;

  const result = await emailProvider.sendEmail({
    to: patient.email || '',
    subject: 'Recall Reminder',
    body: message,
    patientId: patient.id,
    tenantId: recall.tenantId,
  });

  if (result.success) {
    await prisma.recall.update({
      where: { id: recallId },
      data: {
        status: 'due',
        contactCount: { increment: 1 },
        lastContactAt: new Date(),
      },
    });
    return { status: 'sent' };
  } else {
    await prisma.recall.update({
      where: { id: recallId },
      data: {
        status: 'failed',
      },
    });
    throw new Error(result.error || 'Recall send failed');
  }
}

export function createRemindersWorker(): Worker {
  const worker = new Worker('reminders', async (job) => {
    if (job.name === 'send_reminder') {
      return processReminderJob(job);
    } else if (job.name === 'process_recall') {
      return processRecallJob(job);
    }
    throw new Error(`Unknown reminder job type: ${job.name}`);
  }, {
    connection,
    concurrency: 5,
  });

  worker.on('failed', async (job, err) => {
    if (job && job.attemptsMade >= 3) {
      console.error(`Reminder job ${job.id} (${job.name}) failed permanently after ${job.attemptsMade} attempts:`, err.message);
      const dlq = new Queue(DEAD_LETTER_QUEUE, { connection });
      await dlq.add('failed-reminder', {
        ...job.data,
        originalJobId: job.id,
        jobName: job.name,
        failedReason: err.message,
        attemptsMade: job.attemptsMade,
        failedAt: new Date().toISOString(),
      });
      await dlq.close();
    }
  });

  worker.on('completed', (job) => {
    console.log(`Reminder job ${job.id} (${job.name}) completed`);
  });

  worker.on('error', (err) => {
    console.error('Reminders worker error:', err);
  });

  return worker;
}
