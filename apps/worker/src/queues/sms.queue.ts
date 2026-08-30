import { Queue, Worker } from 'bullmq';
import { createRedisConnection } from '../redis';
import prisma from '@danta/database';
import { getSmsProvider } from '../providers/sms.factory';

const connection = createRedisConnection();
const smsProvider = getSmsProvider();

export const smsQueue = new Queue('sms', {
  connection,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 1000,
    },
  },
});

const DEAD_LETTER_QUEUE = 'dead-letter-sms';

export function createSmsWorker(): Worker {
  const worker = new Worker('sms', async (job) => {
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

    const result = await smsProvider.sendSms({
      to: message.recipient,
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
      throw new Error(result.error || 'SMS send failed');
    }
  }, {
    connection,
    concurrency: 5,
  });

  worker.on('failed', async (job, err) => {
    if (job && job.attemptsMade >= 3) {
      console.error(`SMS job ${job.id} failed permanently after ${job.attemptsMade} attempts:`, err.message);
      const dlq = new Queue(DEAD_LETTER_QUEUE, { connection });
      await dlq.add('failed-sms', {
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
    console.log(`SMS job ${job.id} completed`);
  });

  worker.on('error', (err) => {
    console.error('SMS worker error:', err);
  });

  return worker;
}
