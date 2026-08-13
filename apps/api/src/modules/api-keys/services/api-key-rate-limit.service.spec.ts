import { Test, TestingModule } from '@nestjs/testing';
import { ApiKeyRateLimitService } from './api-key-rate-limit.service';

describe('ApiKeyRateLimitService', () => {
  let service: ApiKeyRateLimitService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ApiKeyRateLimitService],
    }).compile();

    service = module.get<ApiKeyRateLimitService>(ApiKeyRateLimitService);
    await service['client'].flushall();
  });

  afterEach(async () => {
    await service['client'].quit();
  });

  describe('checkLimit', () => {
    it('should allow request under limit', async () => {
      const result = await service.checkLimit('key-1', 'tenant-1');

      expect(result.allowed).toBe(true);
      expect(result.remaining).toBeGreaterThan(0);
      expect(result.resetAt).toBeGreaterThan(Date.now());
    });

    it('should track remaining requests', async () => {
      const result = await service.checkLimit('key-2', 'tenant-1', { max: 3, windowMs: 60_000 });

      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(2);
    });

    it('should reject request over limit', async () => {
      const result = await service.checkLimit('key-3', 'tenant-1', { max: 1, windowMs: 60_000 });

      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(0);

      const result2 = await service.checkLimit('key-3', 'tenant-1', { max: 1, windowMs: 60_000 });
      expect(result2.allowed).toBe(false);
      expect(result2.retryAfter).toBeGreaterThan(0);
    });

    it('should use default limits when no rateLimit provided', async () => {
      const result = await service.checkLimit('key-4', 'tenant-1');

      expect(result.allowed).toBe(true);
      expect(result.remaining).toBeLessThanOrEqual(100);
    });
  });

  describe('isAvailable', () => {
    it('should return true when Redis is reachable', async () => {
      const result = await service.isAvailable();
      expect(result).toBe(true);
    });
  });
});
