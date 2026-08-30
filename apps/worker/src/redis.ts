import Redis from 'ioredis';
import { env } from '@danta/config';

export function createRedisConnection(): Redis {
  return new Redis(env.redisUrl, {
    maxRetriesPerRequest: null,
    keepAlive: 30000,
    connectTimeout: 10000,
    retryStrategy: (times) => {
      const delay = Math.min(times * 50, 2000);
      return delay;
    },
  });
}
