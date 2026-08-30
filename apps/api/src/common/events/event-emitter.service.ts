import Redis from 'ioredis';
import { env } from '@danta/config';

export class EventEmitterService {
  private publisher: Redis;
  private subscriber: Redis;
  private handlers: Map<string, Set<(data: unknown) => void>>;

  constructor() {
    this.publisher = new Redis(env.redisUrl, { maxRetriesPerRequest: null });
    this.subscriber = new Redis(env.redisUrl, { maxRetriesPerRequest: null });
    this.handlers = new Map();
  }

  async emit(eventName: string, data: unknown): Promise<void> {
    await this.publisher.publish(eventName, JSON.stringify(data));
  }

  subscribe(eventName: string, handler: (data: unknown) => void): void {
    if (!this.handlers.has(eventName)) {
      this.handlers.set(eventName, new Set());
      this.subscriber.subscribe(eventName);
    }
    this.handlers.get(eventName)!.add(handler);
  }

  unsubscribe(eventName: string, handler: (data: unknown) => void): void {
    const handlers = this.handlers.get(eventName);
    if (handlers) {
      handlers.delete(handler);
      if (handlers.size === 0) {
        this.handlers.delete(eventName);
        this.subscriber.unsubscribe(eventName);
      }
    }
  }

  async disconnect(): Promise<void> {
    await this.subscriber.quit();
    await this.publisher.quit();
  }
}
