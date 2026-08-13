import { Test, TestingModule } from '@nestjs/testing';
import { ApiKeyCacheService } from './api-key-cache.service';

describe('ApiKeyCacheService', () => {
  let service: ApiKeyCacheService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ApiKeyCacheService],
    }).compile();

    service = module.get<ApiKeyCacheService>(ApiKeyCacheService);
  });

  afterEach(async () => {
    await service['client'].quit();
  });

  describe('get', () => {
    it('should return cached value when present', async () => {
      const mockValue = {
        id: 'key-1',
        tenantId: 'tenant-1',
        userId: 'user-1',
        scopes: ['patients:read'],
        env: 'DEV',
      };

      await service['client'].setex(
        `cache:api:DEV:1:abc1234567890123`,
        60,
        JSON.stringify(mockValue),
      );

      const result = await service.get('DEV:1:abc1234567890123');
      expect(result).toEqual(mockValue);
    });

    it('should return null when key not in cache', async () => {
      const result = await service.get('DEV:1:nonexistentprefix12345');
      expect(result).toBeNull();
    });
  });

  describe('set', () => {
    it('should store value with 60s TTL', async () => {
      const mockValue = {
        id: 'key-1',
        tenantId: 'tenant-1',
        userId: 'user-1',
        scopes: ['patients:read'],
        env: 'DEV',
      };

      await service.set('DEV:1:abc1234567890123', mockValue);

      const cached = await service['client'].get('cache:api:DEV:1:abc1234567890123');
      expect(cached).not.toBeNull();
      expect(JSON.parse(cached!)).toEqual(mockValue);

      const ttl = await service['client'].ttl('cache:api:DEV:1:abc1234567890123');
      expect(ttl).toBeGreaterThan(0);
      expect(ttl).toBeLessThanOrEqual(60);
    });
  });

  describe('invalidate', () => {
    it('should remove cached value', async () => {
      await service['client'].setex('cache:api:DEV:1:abc1234567890123', 60, JSON.stringify({}));

      await service.invalidate('DEV:1:abc1234567890123');

      const cached = await service['client'].get('cache:api:DEV:1:abc1234567890123');
      expect(cached).toBeNull();
    });
  });

  describe('isAvailable', () => {
    it('should return true when Redis is reachable', async () => {
      const result = await service.isAvailable();
      expect(result).toBe(true);
    });
  });
});
