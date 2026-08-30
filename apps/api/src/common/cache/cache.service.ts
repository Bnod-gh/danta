import { Injectable, Logger } from '@nestjs/common';
import { Redis } from 'ioredis';
import { env } from '@danta/config';

export interface CacheOptions {
  ttlSeconds: number;
}

export const DEFAULT_CACHE_OPTIONS: CacheOptions = {
  ttlSeconds: 300,
};

@Injectable()
export class CacheService {
  private readonly logger = new Logger(CacheService.name);
  private readonly client: Redis;
  private readonly defaultTtlSeconds = 300;
  private readonly keyPrefix = 'cache:danta';

  constructor() {
    this.client = new Redis(env.redisUrl);
  }

  private buildKey(key: string): string {
    return `${this.keyPrefix}:${key}`;
  }

  async get<T>(key: string): Promise<T | null> {
    try {
      const cached = await this.client.get(this.buildKey(key));
      if (!cached) {
        return null;
      }
      return JSON.parse(cached) as T;
    } catch (error) {
      this.logger.warn(`Redis cache get failed: ${error instanceof Error ? error.message : 'unknown'}`);
      return null;
    }
  }

  async set(key: string, value: unknown, ttlSeconds = this.defaultTtlSeconds): Promise<void> {
    try {
      const fullKey = this.buildKey(key);
      await this.client.setex(fullKey, ttlSeconds, JSON.stringify(value));
    } catch (error) {
      this.logger.warn(`Redis cache set failed: ${error instanceof Error ? error.message : 'unknown'}`);
    }
  }

  async invalidate(key: string): Promise<void> {
    try {
      const fullKey = this.buildKey(key);
      await this.client.del(fullKey);
    } catch (error) {
      this.logger.warn(`Redis cache invalidation failed: ${error instanceof Error ? error.message : 'unknown'}`);
    }
  }

  async invalidateByPrefix(prefix: string): Promise<void> {
    try {
      const pattern = `${this.keyPrefix}:${prefix}*`;
      const keys = await this.client.keys(pattern);
      if (keys.length > 0) {
        await this.client.del(keys);
      }
    } catch (error) {
      this.logger.warn(`Redis cache prefix invalidation failed: ${error instanceof Error ? error.message : 'unknown'}`);
    }
  }

  async isAvailable(): Promise<boolean> {
    try {
      await this.client.ping();
      return true;
    } catch {
      return false;
    }
  }
}
