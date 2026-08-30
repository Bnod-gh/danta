import { Queue, Worker } from 'bullmq';
import { createRedisConnection } from '../redis';
import prisma from '@danta/database';
import { SmtpEmailProvider } from '../providers/smtp-email.provider';

const connection = createRedisConnection();
const emailProvider = new SmtpEmailProvider();

export const emailQueue = new Queue('email', {
  connection,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 1000,
    },
  },
});

const DEAD_LETTER_QUEUE = 'dead-letter-email';

export function createEmailWorker(): Worker {
  const worker = new Worker('email', async (job) => {
    const { messageId } = job.data as { messageId: string };

    const message = await prisma.message.findFirst({
      where: { id: messageId },
    });

    if (!message) {
      throw new Error(`Message ${messageId} not found`);
    }

    if (message.status === 'sent' || message.status === 'delivered' || message.status === 'read') {
      return { status: 'already_processed' };
    }

    if (message.status === 'failed') {
      return { status: 'already_failed' };
    }

    const result = await emailProvider.sendEmail({
      to: message.recipient,
      subject: message.subject || '',
      body: message.body,
      patientId: message.patientId || undefined,
      tenantId: message.tenantId,
    });

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
      return { status: 'sent' };
    } else {
      await prisma.message.update({
        where: { id: messageId },
        data: {
          status: 'failed',
          provider: result.provider,
          error: result.error,
        },
      });
      throw new Error(result.error || 'Email send failed');
    }
  }, {
    connection,
    concurrency: 5,
  });

  worker.on('failed', async (job, err) => {
    if (job && job.attemptsMade >= 3) {
      console.error(`Email job ${job.id} failed permanently after ${job.attemptsMade} attempts:`, err.message);
      const dlq = new Queue(DEAD_LETTER_QUEUE, { connection });
      await dlq.add('failed-email', {
        ...job.data,
        originalJobId: job.id,
        failedReason: err.message,
        attemptsMade: job.attemptsMade,
        failedAt: new Date().toISOString(),
      });
      await dlq.close();
    }
  });

  worker.on('completed', (job) => {
    console.log(`Email job ${job.id} completed`);
  });

  worker.on('error', (err) => {
    console.error('Email worker error:', err);
  });

  return worker;
}
