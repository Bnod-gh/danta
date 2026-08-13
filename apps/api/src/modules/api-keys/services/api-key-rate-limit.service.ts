import { Injectable, Logger, HttpException } from '@nestjs/common';
import { Redis } from 'ioredis';
import { env } from '@danta/config';

@Injectable()
export class ApiKeyRateLimitService {
  private readonly logger = new Logger(ApiKeyRateLimitService.name);
  private readonly client: Redis;
  private readonly defaultMax = 100;
  private readonly defaultWindowMs = 60_000;
  private readonly keyPrefix = 'ratelimit:api';

  constructor() {
    this.client = new Redis(env.redisUrl);
  }

  async checkLimit(keyId: string, _tenantId: string, rateLimit?: { max: number; windowMs: number }): Promise<{
    allowed: boolean;
    remaining: number;
    resetAt: number;
    retryAfter?: number;
  }> {
    try {
      await this.client.ping();
    } catch (error) {
      this.logger.error(`Redis unavailable for rate limiting: ${error instanceof Error ? error.message : 'unknown'}`);
      throw new HttpException('Rate limit service unavailable', 503);
    }

    const max = rateLimit?.max ?? this.defaultMax;
    const windowMs = rateLimit?.windowMs ?? this.defaultWindowMs;
    const windowSeconds = Math.ceil(windowMs / 1000);
    const now = Date.now();
    const windowStart = now - windowMs;

    const key = `${this.keyPrefix}:${keyId}:${windowSeconds}`;

    await this.client.zadd(key, now, now.toString());
    await this.client.zremrangebyscore(key, '-inf', windowStart.toString());
    const count = await this.client.zcard(key);
    const remaining = Math.max(0, max - count);
    const resetAt = now + windowMs;

    await this.client.expire(key, windowSeconds + 60);

    if (count > max) {
      const retryAfter = Math.ceil((resetAt - now) / 1000);
      return { allowed: false, remaining: 0, resetAt, retryAfter };
    }

    return { allowed: true, remaining, resetAt };
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
