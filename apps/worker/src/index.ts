import { Worker } from 'bullmq';
import Redis from 'ioredis';
import { env } from '@danta/config';

const connection = new Redis(env.redisUrl);

const worker = new Worker('danta', async (job) => {
  console.log(`Processing job ${job.id} of type ${job.name}`);
}, { connection });

worker.on('completed', (job) => {
  console.log(`Job ${job.id} completed`);
});

worker.on('failed', (job, err) => {
  console.error(`Job ${job?.id} failed:`, err);
});

process.on('SIGINT', async () => {
  await worker.close();
  await connection.quit();
  process.exit(0);
});
