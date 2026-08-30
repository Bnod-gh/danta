import { Queue, Worker } from 'bullmq';
import { createRedisConnection } from '../redis';
import prisma from '@danta/database';

const connection = createRedisConnection();

export const imagingQueue = new Queue('imaging', {
  connection,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000,
    },
  },
});

const DEAD_LETTER_QUEUE = 'dead-letter-imaging';

export function createImagingWorker(): Worker {
  const worker = new Worker('imaging', async (job) => {
    const { imageId, imagingStudyId, operation } = job.data as {
      imageId: string;
      imagingStudyId: string;
      operation: 'process' | 'thumbnail';
    };

    const image = await prisma.imagingImage.findFirst({
      where: { id: imageId, imagingStudyId },
    });

    if (!image) {
      throw new Error(`Imaging image ${imageId} not found`);
    }

    const currentMetadata = (image.metadata || {}) as Record<string, unknown>;

    if (operation === 'thumbnail') {
      console.log(`Generating thumbnail for image ${imageId} (${image.fileName})`);

      const thumbnailKey = `thumbnails/${image.storageKey}`;

      await prisma.imagingImage.update({
        where: { id: imageId },
        data: {
          metadata: { ...currentMetadata, thumbnailKey, generatedAt: new Date().toISOString() },
        },
      });

      return { status: 'completed', thumbnailKey };
    }

    if (operation === 'process') {
      console.log(`Processing image ${imageId} (${image.fileName})`);

      await prisma.imagingImage.update({
        where: { id: imageId },
        data: {
          metadata: { ...currentMetadata, processedAt: new Date().toISOString() },
        },
      });

      return { status: 'completed' };
    }

    throw new Error(`Unknown imaging operation: ${operation}`);
  }, {
    connection,
    concurrency: 2,
  });

  worker.on('failed', async (job, err) => {
    if (job && job.attemptsMade >= 3) {
      console.error(`Imaging job ${job.id} failed permanently after ${job.attemptsMade} attempts:`, err.message);
      const dlq = new Queue(DEAD_LETTER_QUEUE, { connection });
      await dlq.add('failed-imaging', {
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
    console.log(`Imaging job ${job.id} completed`);
  });

  worker.on('error', (err) => {
    console.error('Imaging worker error:', err);
  });

  return worker;
}
