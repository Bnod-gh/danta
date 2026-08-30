import { Injectable, Logger } from '@nestjs/common';
import { Queue } from 'bullmq';
import Redis from 'ioredis';
import { env } from '@danta/config';

/**
 * Fire-and-forget producer for the shared `danta` BullMQ queue consumed by
 * the worker app. Enqueue failures are logged and swallowed: a Redis outage
 * must never block or fail a clinical request. PostgreSQL remains the source
 * of truth; jobs are best-effort side effects.
 */
@Injectable()
export class QueueService {
  private readonly logger = new Logger(QueueService.name);
  private queue?: Queue;

  private getQueue(): Queue {
    if (!this.queue) {
      const connection = new Redis(env.redisUrl, { maxRetriesPerRequest: null });
      this.queue = new Queue('danta', { connection });
    }
    return this.queue;
  }

  async enqueue(name: string, data: Record<string, unknown>): Promise<boolean> {
    try {
      await this.getQueue().add(name, data, {
        attempts: 3,
        backoff: { type: 'exponential', delay: 2000 },
        removeOnComplete: 500,
        removeOnFail: 2000,
        jobId: data.idempotencyKey as string | undefined,
      });
      return true;
    } catch (error) {
      this.logger.error(`Failed to enqueue job ${name}: ${error instanceof Error ? error.message : String(error)}`);
      return false;
    }
  }
}
