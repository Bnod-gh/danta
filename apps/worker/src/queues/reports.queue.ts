import { Queue, Worker } from 'bullmq';
import { createRedisConnection } from '../redis';
import prisma from '@danta/database';

const connection = createRedisConnection();

export const reportsQueue = new Queue('reports', {
  connection,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000,
    },
  },
});

const DEAD_LETTER_QUEUE = 'dead-letter-reports';

export function createReportsWorker(): Worker {
  const worker = new Worker('reports', async (job) => {
    const { reportType, tenantId, startDate, endDate, format } = job.data as {
      reportType: string;
      tenantId: string;
      startDate: string;
      endDate: string;
      format?: string;
    };

    try {
      const start = new Date(startDate);
      const end = new Date(endDate);
      let reportData: unknown;

      switch (reportType) {
        case 'revenue':
          reportData = await prisma.payment.findMany({
            where: {
              tenantId,
              receivedAt: { gte: start, lte: end },
              status: 'completed',
            },
            select: { receivedAt: true, amount: true, method: true },
            take: 50000,
          });
          break;
        case 'appointments':
          reportData = await prisma.appointment.findMany({
            where: {
              tenantId,
              startTime: { gte: start, lte: end },
            },
            include: {
              patient: { select: { firstName: true, lastName: true } },
              provider: { select: { firstName: true, lastName: true } },
              appointmentType: true,
            },
            take: 50000,
          });
          break;
        case 'patients':
          reportData = await prisma.patient.findMany({
            where: {
              tenantId,
              createdAt: { gte: start, lte: end },
            },
            select: { firstName: true, lastName: true, dateOfBirth: true, createdAt: true },
            take: 50000,
          });
          break;
        default:
          throw new Error(`Unsupported report type: ${reportType}`);
      }

      if (format === 'csv' && Array.isArray(reportData)) {
        console.log(`Report ${reportType} generated with ${reportData.length} rows`);
      }

      return { status: 'completed', data: reportData };
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Report generation failed');
    }
  }, {
    connection,
    concurrency: 2,
  });

  worker.on('failed', async (job, err) => {
    if (job && job.attemptsMade >= 3) {
      console.error(`Report job ${job.id} failed permanently after ${job.attemptsMade} attempts:`, err.message);
      const dlq = new Queue(DEAD_LETTER_QUEUE, { connection });
      await dlq.add('failed-report', {
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
    console.log(`Report job ${job.id} completed`);
  });

  worker.on('error', (err) => {
    console.error('Reports worker error:', err);
  });

  return worker;
}
