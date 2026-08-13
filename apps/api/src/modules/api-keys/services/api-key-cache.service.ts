import { Injectable, Logger } from '@nestjs/common';
import { Redis } from 'ioredis';
import { env } from '@danta/config';

@Injectable()
export class ApiKeyCacheService {
  private readonly logger = new Logger(ApiKeyCacheService.name);
  private readonly client: Redis;
  private readonly ttlSeconds = 60;
  private readonly keyPrefix = 'cache:api';

  constructor() {
    this.client = new Redis(env.redisUrl);
  }

  async get(keyPrefix: string): Promise<{
    id: string;
    tenantId: string;
    userId: string;
    scopes: string[];
    env: string;
  } | null> {
    try {
      const key = `${this.keyPrefix}:${keyPrefix}`;
      const cached = await this.client.get(key);

      if (!cached) {
        return null;
      }

      return JSON.parse(cached) as {
        id: string;
        tenantId: string;
        userId: string;
        scopes: string[];
        env: string;
      };
    } catch (error) {
      this.logger.warn(`Redis cache get failed: ${error instanceof Error ? error.message : 'unknown'}`);
      return null;
    }
  }

  async set(keyPrefix: string, value: {
    id: string;
    tenantId: string;
    userId: string;
    scopes: string[];
    env: string;
  }): Promise<void> {
    try {
      const key = `${this.keyPrefix}:${keyPrefix}`;
      await this.client.setex(key, this.ttlSeconds, JSON.stringify(value));
    } catch (error) {
      this.logger.warn(`Redis cache set failed: ${error instanceof Error ? error.message : 'unknown'}`);
    }
  }

  async invalidate(keyPrefix: string): Promise<void> {
    try {
      const key = `${this.keyPrefix}:${keyPrefix}`;
      await this.client.del(key);
    } catch (error) {
      this.logger.warn(`Redis cache invalidation failed: ${error instanceof Error ? error.message : 'unknown'}`);
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
