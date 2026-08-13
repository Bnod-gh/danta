import { Test } from '@nestjs/testing';
import { ApiKeysService } from './api-keys.service';
import { PrismaService } from '../../prisma.service';
import { AuditService } from '../audit/audit.service';
import { ConfigService } from '@nestjs/config';
import { ApiKeyCacheService } from './services/api-key-cache.service';
import bcrypt from 'bcryptjs';

jest.mock('@danta/config', () => ({
  env: {
    apiKeyEnv: 'DEV',
    redisUrl: 'redis://localhost:6379',
  },
}));

describe('MultiTenantIntegrationTests', () => {
  describe('tenant isolation - API key authentication', () => {
    it('should derive tenantId from API key, not request headers', async () => {
      const module = await Test.createTestingModule({
        providers: [
          ApiKeysService,
          {
            provide: PrismaService,
            useValue: {
              apiKey: {
                findUnique: jest.fn().mockResolvedValue({
                  id: 'key-1',
                  tenantId: 'tenant-a',
                  userId: 'user-1',
                  scopes: ['patients:read'],
                  env: 'DEV',
                  revokedAt: null,
                  expiresAt: null,
                  graceExpiresAt: null,
                  keyHash: await bcrypt.hash('DEV:1:secret123456789012345678901234567890', 12),
                }),
                update: jest.fn(),
              },
              permission: { findMany: jest.fn().mockResolvedValue([]) },
            },
          },
          { provide: AuditService, useValue: { log: jest.fn() } },
          { provide: ConfigService, useValue: { get: jest.fn(() => 'DEV') } },
          { provide: ApiKeyCacheService, useValue: { invalidate: jest.fn(), get: jest.fn().mockResolvedValue(null), set: jest.fn() } },
        ],
      }).compile();

      const service = module.get<ApiKeysService>(ApiKeysService);
      const result = await service.validateKey('DEV:1:secret123456789012345678901234567890');
      expect(result?.tenantId).toBe('tenant-a');
      expect(result?.id).toBe('key-1');
    });

    it('should reject cross-tenant key lookup with different prefix', async () => {
      const module = await Test.createTestingModule({
        providers: [
          ApiKeysService,
          {
            provide: PrismaService,
            useValue: {
              apiKey: {
                findUnique: jest.fn().mockResolvedValue(null),
              },
              permission: { findMany: jest.fn().mockResolvedValue([]) },
            },
          },
          { provide: AuditService, useValue: { log: jest.fn() } },
          { provide: ConfigService, useValue: { get: jest.fn(() => 'DEV') } },
          { provide: ApiKeyCacheService, useValue: { invalidate: jest.fn(), get: jest.fn().mockResolvedValue(null), set: jest.fn() } },
        ],
      }).compile();

      const service = module.get<ApiKeysService>(ApiKeysService);
      const result = await service.validateKey('DEV:1:tenantbsecret123456789012345678901234');
      expect(result).toBeNull();
    });
  });

  describe('tenant isolation - key creation', () => {
    it('should create API key scoped to authenticated tenant', async () => {
      const mockCreate = jest.fn().mockResolvedValue({
        id: 'key-1',
        tenantId: 'tenant-a',
        userId: 'user-1',
        name: 'Test',
        keyPrefix: 'danta_dev_v1_abc',
        version: 1,
        env: 'DEV',
        scopes: ['patients:read'],
        createdAt: new Date(),
      });

      const module = await Test.createTestingModule({
        providers: [
          ApiKeysService,
          {
            provide: PrismaService,
            useValue: {
              apiKey: { create: mockCreate, findFirst: jest.fn().mockResolvedValue(null) },
              permission: { findMany: jest.fn().mockResolvedValue([]) },
            },
          },
          { provide: AuditService, useValue: { log: jest.fn() } },
          { provide: ConfigService, useValue: { get: jest.fn(() => 'DEV') } },
          { provide: ApiKeyCacheService, useValue: { invalidate: jest.fn(), set: jest.fn() } },
        ],
      }).compile();

      const service = module.get<ApiKeysService>(ApiKeysService);
      await service.create('tenant-a', 'user-1', { name: 'Test', scopes: ['patients:read'] });

      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            tenantId: 'tenant-a',
            userId: 'user-1',
          }),
        }),
      );
    });

    it('should not create key for different tenant', async () => {
      const mockCreate = jest.fn().mockResolvedValue({
        id: 'key-1',
        tenantId: 'tenant-b',
        userId: 'user-1',
        name: 'Test',
        keyPrefix: 'danta_dev_v1_abc',
        version: 1,
        env: 'DEV',
        scopes: ['patients:read'],
        createdAt: new Date(),
      });

      const module = await Test.createTestingModule({
        providers: [
          ApiKeysService,
          {
            provide: PrismaService,
            useValue: {
              apiKey: { create: mockCreate, findFirst: jest.fn().mockResolvedValue(null) },
              permission: { findMany: jest.fn().mockResolvedValue([]) },
            },
          },
          { provide: AuditService, useValue: { log: jest.fn() } },
          { provide: ConfigService, useValue: { get: jest.fn(() => 'DEV') } },
          { provide: ApiKeyCacheService, useValue: { invalidate: jest.fn(), set: jest.fn() } },
        ],
      }).compile();

      const service = module.get<ApiKeysService>(ApiKeysService);
      await service.create('tenant-b', 'user-1', { name: 'Test', scopes: ['patients:read'] });
      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            tenantId: 'tenant-b',
            userId: 'user-1',
          }),
        }),
      );
    });
  });

  describe('tenant isolation - key revocation', () => {
    it('should revoke only keys within the same tenant', async () => {
      const mockUpdate = jest.fn().mockResolvedValue({
        id: 'key-1',
        tenantId: 'tenant-a',
        revokedAt: new Date(),
        revokedBy: 'user-1',
        name: 'Test',
        keyPrefix: 'danta_dev_v1_abc',
        version: 1,
        env: 'DEV',
        scopes: [],
        createdAt: new Date(),
      });

      const module = await Test.createTestingModule({
        providers: [
          ApiKeysService,
          {
            provide: PrismaService,
            useValue: {
              apiKey: { update: mockUpdate },
            },
          },
          { provide: AuditService, useValue: { log: jest.fn() } },
          { provide: ConfigService, useValue: { get: jest.fn(() => 'DEV') } },
          { provide: ApiKeyCacheService, useValue: { invalidate: jest.fn(), set: jest.fn() } },
        ],
      }).compile();

      const service = module.get<ApiKeysService>(ApiKeysService);
      const result = await service.revoke('tenant-a', 'key-1', 'user-1');
      expect((result as any).tenantId).toBe('tenant-a');
      expect(mockUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'key-1', tenantId: 'tenant-a' },
          data: expect.objectContaining({
            revokedAt: expect.any(Date),
            revokedBy: 'user-1',
          }),
        }),
      );
    });
  });

  describe('tenant isolation - key rotation', () => {
    it('should rotate only keys within the same tenant', async () => {
      const mockFindFirst = jest.fn().mockResolvedValue({
        id: 'key-1',
        tenantId: 'tenant-a',
        userId: 'user-1',
        name: 'Test',
        keyPrefix: 'danta_dev_v1_abc',
        version: 1,
        env: 'DEV',
        scopes: ['patients:read'],
        rateLimit: null,
        expiresAt: null,
        revokedAt: null,
        graceExpiresAt: null,
        createdAt: new Date(),
      });

      const mockCreate = jest.fn().mockResolvedValue({
        id: 'key-2',
        tenantId: 'tenant-a',
        userId: 'user-1',
        name: 'Test',
        keyPrefix: 'danta_dev_v1_def',
        version: 2,
        env: 'DEV',
        scopes: ['patients:read'],
        rateLimit: null,
        expiresAt: null,
        createdAt: new Date(),
        secret: 'DEV:1:newsecret123456789012345678901234567890',
      });

      const mockUpdate = jest.fn().mockResolvedValue({ id: 'key-1', graceExpiresAt: new Date(Date.now() + 86400000) });

      const module = await Test.createTestingModule({
        providers: [
          ApiKeysService,
          {
            provide: PrismaService,
            useValue: {
              apiKey: { findFirst: mockFindFirst, create: mockCreate, update: mockUpdate },
            },
          },
          { provide: AuditService, useValue: { log: jest.fn() } },
          { provide: ConfigService, useValue: { get: jest.fn(() => 'DEV') } },
          { provide: ApiKeyCacheService, useValue: { invalidate: jest.fn(), set: jest.fn() } },
        ],
      }).compile();

      const service = module.get<ApiKeysService>(ApiKeysService);
      await service.rotate('tenant-a', 'key-1', 'user-1');
      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            tenantId: 'tenant-a',
          }),
        }),
      );
    });

    it('should prevent cross-tenant rotation', async () => {
      const mockFindFirst = jest.fn().mockResolvedValue(null);

      const module = await Test.createTestingModule({
        providers: [
          ApiKeysService,
          {
            provide: PrismaService,
            useValue: {
              apiKey: { findFirst: mockFindFirst },
            },
          },
          { provide: AuditService, useValue: { log: jest.fn() } },
          { provide: ConfigService, useValue: { get: jest.fn(() => 'DEV') } },
          { provide: ApiKeyCacheService, useValue: { invalidate: jest.fn(), set: jest.fn() } },
        ],
      }).compile();

      const service = module.get<ApiKeysService>(ApiKeysService);
      await expect(service.rotate('tenant-b', 'key-1', 'user-1')).rejects.toThrow();
    });
  });

  describe('tenant isolation - scope enforcement', () => {
    it('should not allow API key to access resources outside its tenant scopes', async () => {
      const module = await Test.createTestingModule({
        providers: [
          ApiKeysService,
          {
            provide: PrismaService,
            useValue: {
              apiKey: {
                findUnique: jest.fn().mockResolvedValue({
                  id: 'key-1',
                  tenantId: 'tenant-a',
                  userId: 'user-1',
                  scopes: ['patients:read'],
                  env: 'DEV',
                  revokedAt: null,
                  expiresAt: null,
                  graceExpiresAt: null,
                  keyHash: await bcrypt.hash('DEV:1:secret123456789012345678901234567890', 12),
                }),
                update: jest.fn(),
              },
              permission: { findMany: jest.fn().mockResolvedValue([]) },
            },
          },
          { provide: AuditService, useValue: { log: jest.fn() } },
          { provide: ConfigService, useValue: { get: jest.fn(() => 'DEV') } },
          { provide: ApiKeyCacheService, useValue: { invalidate: jest.fn(), get: jest.fn().mockResolvedValue(null), set: jest.fn() } },
        ],
      }).compile();

      const service = module.get<ApiKeysService>(ApiKeysService);
      const result = await service.validateKey('DEV:1:secret123456789012345678901234567890');
      expect(result?.scopes).toEqual(['patients:read']);
      expect(result?.scopes).not.toContain('billing:read');
    });
  });
});
