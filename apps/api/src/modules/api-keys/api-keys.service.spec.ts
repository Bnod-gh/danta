import { Test, TestingModule } from '@nestjs/testing';
import { ApiKeysService } from './api-keys.service';
import { PrismaService } from '../../prisma.service';
import { AuditService } from '../audit/audit.service';
import { ConfigService } from '@nestjs/config';
import { ApiKeyCacheService } from './services/api-key-cache.service';
import { ApiKeyRateLimitService } from './services/api-key-rate-limit.service';
import bcrypt from 'bcryptjs';

jest.mock('@danta/config', () => ({
  env: {
    apiKeyEnv: 'DEV',
  },
}));

describe('ApiKeysService', () => {
  let service: ApiKeysService;
  let prisma: PrismaService;
  let auditService: AuditService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ApiKeysService,
        {
          provide: PrismaService,
          useValue: {
             apiKey: {
              create: jest.fn(),
              findMany: jest.fn(),
              findUnique: jest.fn(),
              findFirst: jest.fn(),
              update: jest.fn(),
            },
            permission: {
              findMany: jest.fn(),
            },
          },
        },
        {
          provide: AuditService,
          useValue: {
            log: jest.fn(),
          },
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => {
              if (key === 'API_KEY_ENV') return 'DEV';
              return undefined;
            }),
          },
        },
        {
          provide: ApiKeyCacheService,
          useValue: {
            get: jest.fn().mockResolvedValue(null),
            set: jest.fn().mockResolvedValue(undefined),
            invalidate: jest.fn().mockResolvedValue(undefined),
          },
        },
        {
          provide: ApiKeyRateLimitService,
          useValue: {
            checkLimit: jest.fn().mockResolvedValue({ allowed: true, remaining: 100, resetAt: Date.now() + 60000 }),
            isAvailable: jest.fn().mockResolvedValue(true),
          },
        },
      ],
    }).compile();

    service = module.get<ApiKeysService>(ApiKeysService);
    prisma = module.get<PrismaService>(PrismaService);
    auditService = module.get<AuditService>(AuditService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a new API key with secure secret', async () => {
      const mockCreate = jest.fn().mockResolvedValue({
        id: 'key-1',
        tenantId: 'tenant-1',
        userId: 'user-1',
        name: 'Test Key',
        env: 'DEV',
        version: 1,
        keyPrefix: 'DEV:1:abc',
        keyHash: 'hashed-secret',
        scopes: ['patients:read'],
        rateLimit: null,
        lastUsedAt: null,
        expiresAt: null,
        revokedAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      (prisma.apiKey.create as jest.Mock) = mockCreate;

      const result = await service.create('tenant-1', 'user-1', {
        name: 'Test Key',
        scopes: ['patients:read'],
      });

      expect(result).toHaveProperty('id');
      expect(result).toHaveProperty('secret');
      expect(result.secret).toMatch(/^DEV:1:[a-f0-9]{64}$/);
      expect(mockCreate).toHaveBeenCalledTimes(1);
      const createCall = mockCreate.mock.calls[0][0];
      expect(createCall.data.tenantId).toBe('tenant-1');
      expect(createCall.data.userId).toBe('user-1');
      expect(createCall.data.name).toBe('Test Key');
      expect(createCall.data.env).toBe('DEV');
      expect(createCall.data.version).toBe(1);
      expect(createCall.data.scopes).toEqual(['patients:read']);
      expect(createCall.data.keyPrefix).toBe(result.secret.slice(0, 16));
      expect(createCall.data.keyHash).toBeDefined();
      expect(createCall.data.keyHash).not.toBe(result.secret);
    });

    it('should not store plaintext secret', async () => {
      const mockCreate = jest.fn().mockResolvedValue({
        id: 'key-1',
        tenantId: 'tenant-1',
        userId: 'user-1',
        name: 'Test Key',
        env: 'DEV',
        version: 1,
        keyPrefix: 'DEV:1:abc',
        keyHash: 'hashed-secret',
        scopes: [],
        rateLimit: null,
        lastUsedAt: null,
        expiresAt: null,
        revokedAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      (prisma.apiKey.create as jest.Mock) = mockCreate;

      const result = await service.create('tenant-1', 'user-1', {
        name: 'Test Key',
        scopes: [],
      });

      const createCall = mockCreate.mock.calls[0][0];
      expect(createCall.data.keyHash).not.toBe(result.secret);
      expect(createCall.data.keyHash).toMatch(/^\$2[aby]?\$.{56,59}$/);
    });

    it('should reject wildcard scopes', async () => {
      await expect(
        service.create('tenant-1', 'user-1', {
          name: 'Wildcard Key',
          scopes: ['*'],
        }),
      ).rejects.toThrow('Wildcard scopes are not allowed in V1');

      await expect(
        service.create('tenant-1', 'user-1', {
          name: 'Wildcard Key',
          scopes: ['patients:*'],
        }),
      ).rejects.toThrow('Wildcard scopes are not allowed in V1');
    });

    it('should reject excessive scopes', async () => {
      const tooManyScopes = Array.from({ length: 21 }, (_, i) => `scope:${i}`);

      await expect(
        service.create('tenant-1', 'user-1', {
          name: 'Too Many Scopes',
          scopes: tooManyScopes,
        }),
      ).rejects.toThrow('Maximum 20 scopes allowed per API key');
    });

    it('should accept valid explicit scopes', async () => {
      const mockCreate = jest.fn().mockResolvedValue({
        id: 'key-1',
        tenantId: 'tenant-1',
        userId: 'user-1',
        name: 'Valid Key',
        env: 'DEV',
        version: 1,
        keyPrefix: 'DEV:1:abc',
        keyHash: 'hashed',
        scopes: ['patients:read', 'appointments:write'],
        rateLimit: null,
        lastUsedAt: null,
        expiresAt: null,
        revokedAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      (prisma.apiKey.create as jest.Mock) = mockCreate;

      const result = await service.create('tenant-1', 'user-1', {
        name: 'Valid Key',
        scopes: ['patients:read', 'appointments:write'],
      });

      expect(result.scopes).toEqual(['patients:read', 'appointments:write']);
    });
  });

  describe('findAll', () => {
    it('should return metadata only, excluding keyHash', async () => {
      const mockFindMany = jest.fn().mockResolvedValue([
        {
          id: 'key-1',
          name: 'Test Key',
          keyPrefix: 'DEV:1:abc',
          env: 'DEV',
          version: 1,
          scopes: ['patients:read'],
          rateLimit: null,
          lastUsedAt: null,
          expiresAt: null,
          revokedAt: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ]);

      (prisma.apiKey.findMany as jest.Mock) = mockFindMany;

      const result = await service.findAll('tenant-1');

      expect(result).toHaveLength(1);
      expect(result[0]).not.toHaveProperty('keyHash');
      expect(result[0]).toHaveProperty('env');
      expect(result[0]).toHaveProperty('version');
    });
  });

  describe('revoke', () => {
    it('should revoke a key and set audit fields', async () => {
      const mockUpdate = jest.fn().mockResolvedValue({
        id: 'key-1',
        tenantId: 'tenant-1',
        userId: 'user-1',
        name: 'Test Key',
        revokedAt: new Date(),
        revokedBy: 'user-1',
        revocationReason: 'compromised',
      });

      (prisma.apiKey.update as jest.Mock) = mockUpdate;

      const result = await service.revoke('tenant-1', 'key-1', 'user-1', 'compromised');

      expect(result.revokedAt).toBeInstanceOf(Date);
      expect(result.revokedBy).toBe('user-1');
      expect(result.revocationReason).toBe('compromised');
      expect(mockUpdate).toHaveBeenCalledWith({
        where: { id: 'key-1', tenantId: 'tenant-1' },
        data: {
          revokedAt: expect.any(Date),
          revokedBy: 'user-1',
          revocationReason: 'compromised',
        },
      });
    });

    it('should audit revoke action', async () => {
      const mockUpdate = jest.fn().mockResolvedValue({
        id: 'key-1',
        tenantId: 'tenant-1',
        revokedAt: new Date(),
        revokedBy: 'user-1',
        revocationReason: null,
      });

      (prisma.apiKey.update as jest.Mock) = mockUpdate;

      await service.revoke('tenant-1', 'key-1', 'user-1');

      expect(auditService.log).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'api_key.revoke',
          resourceId: 'key-1',
        }),
      );
    });
  });

  describe('validateKey', () => {
    it('should return identity for valid key', async () => {
      const mockFindUnique = jest.fn().mockResolvedValue({
        id: 'key-1',
        tenantId: 'tenant-1',
        userId: 'user-1',
        keyHash: await bcrypt.hash('DEV:1:validsecret', 12),
        scopes: ['patients:read'],
        env: 'DEV',
        rateLimit: undefined,
        revokedAt: null,
        expiresAt: null,
      });

      (prisma.apiKey.findUnique as jest.Mock) = mockFindUnique;
      (prisma.apiKey.update as jest.Mock) = jest.fn();

      const result = await service.validateKey('DEV:1:validsecret');

      expect(result).toEqual({
        id: 'key-1',
        tenantId: 'tenant-1',
        userId: 'user-1',
        scopes: ['patients:read'],
        env: 'DEV',
        type: 'api-key',
      });
    });

    it('should reject revoked key', async () => {
      const mockFindUnique = jest.fn().mockResolvedValue({
        id: 'key-1',
        tenantId: 'tenant-1',
        userId: 'user-1',
        keyHash: await bcrypt.hash('DEV:1:secret', 12),
        scopes: [],
        env: 'DEV',
        rateLimit: undefined,
        revokedAt: new Date(),
        expiresAt: null,
      });

      (prisma.apiKey.findUnique as jest.Mock) = mockFindUnique;

      const result = await service.validateKey('DEV:1:secret');
      expect(result).toBeNull();
    });

    it('should reject expired key', async () => {
      const mockFindUnique = jest.fn().mockResolvedValue({
        id: 'key-1',
        tenantId: 'tenant-1',
        userId: 'user-1',
        keyHash: await bcrypt.hash('DEV:1:secret', 12),
        scopes: [],
        env: 'DEV',
        rateLimit: undefined,
        revokedAt: null,
        expiresAt: new Date(Date.now() - 86400000),
      });

      (prisma.apiKey.findUnique as jest.Mock) = mockFindUnique;

      const result = await service.validateKey('DEV:1:secret');
      expect(result).toBeNull();
      expect(auditService.log).toHaveBeenCalledTimes(1);
      expect(auditService.log).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'api_key.expired',
          resourceType: 'api_key',
          resourceId: 'key-1',
          result: 'denied',
          metadata: expect.objectContaining({
            reason: 'key_expired',
          }),
        }),
      );
    });

    it('should reject environment mismatch', async () => {
      const mockFindUnique = jest.fn().mockResolvedValue({
        id: 'key-1',
        tenantId: 'tenant-1',
        userId: 'user-1',
        keyHash: await bcrypt.hash('PROD:1:secret', 12),
        scopes: [],
        env: 'PROD',
        rateLimit: undefined,
        revokedAt: null,
        expiresAt: null,
      });

      (prisma.apiKey.findUnique as jest.Mock) = mockFindUnique;

      const result = await service.validateKey('PROD:1:secret');
      expect(result).toBeNull();
    });

    it('should return null for unknown key', async () => {
      (prisma.apiKey.findUnique as jest.Mock) = jest.fn().mockResolvedValue(null);

      const result = await service.validateKey('DEV:1:nonexistent');
      expect(result).toBeNull();
    });

    it('should update lastUsedAt on successful validation', async () => {
      const mockFindUnique = jest.fn().mockResolvedValue({
        id: 'key-1',
        tenantId: 'tenant-1',
        userId: 'user-1',
        keyHash: await bcrypt.hash('DEV:1:validsecret', 12),
        scopes: [],
        env: 'DEV',
        rateLimit: undefined,
        revokedAt: null,
        expiresAt: null,
      });

      const mockUpdate = jest.fn();
      (prisma.apiKey.findUnique as jest.Mock) = mockFindUnique;
      (prisma.apiKey.update as jest.Mock) = mockUpdate;

      await service.validateKey('DEV:1:validsecret');

      expect(mockUpdate).toHaveBeenCalledWith({
        where: { id: 'key-1' },
        data: { lastUsedAt: expect.any(Date) },
      });
    });

    it('should reject key past grace period', async () => {
      const mockFindUnique = jest.fn().mockResolvedValue({
        id: 'key-1',
        tenantId: 'tenant-1',
        userId: 'user-1',
        keyHash: await bcrypt.hash('DEV:1:secret', 12),
        scopes: [],
        env: 'DEV',
        rateLimit: undefined,
        revokedAt: null,
        expiresAt: null,
        graceExpiresAt: new Date(Date.now() - 86400000),
      });

      (prisma.apiKey.findUnique as jest.Mock) = mockFindUnique;

      const result = await service.validateKey('DEV:1:secret');
      expect(result).toBeNull();
    });
  });

  describe('rotate', () => {
    it('should create new key and set grace period on old key', async () => {
      const oldKey = {
        id: 'key-1',
        tenantId: 'tenant-1',
        userId: 'user-1',
        name: 'Test Key',
        env: 'DEV',
        scopes: ['patients:read'],
        rateLimit: null,
        expiresAt: null,
        version: 1,
        revokedAt: null,
        graceExpiresAt: null,
        keyPrefix: 'DEV:1:oldprefix',
      };

      const mockFindFirst = jest.fn().mockResolvedValue(oldKey);
      (prisma.apiKey.findFirst as jest.Mock) = mockFindFirst;

      const mockCreate = jest.fn().mockResolvedValue({
        id: 'key-2',
        tenantId: 'tenant-1',
        userId: 'user-1',
        name: 'Test Key',
        env: 'DEV',
        version: 2,
        keyPrefix: 'DEV:1:newprefix',
        keyHash: 'hashed',
        scopes: ['patients:read'],
        rateLimit: null,
        lastUsedAt: null,
        expiresAt: null,
        revokedAt: null,
        previousKeyId: 'key-1',
        graceExpiresAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      (prisma.apiKey.create as jest.Mock) = mockCreate;

      const mockUpdate = jest.fn().mockResolvedValue({
        ...oldKey,
        graceExpiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      });
      (prisma.apiKey.update as jest.Mock) = mockUpdate;

      const result = await service.rotate('tenant-1', 'key-1', 'user-1');

      expect(result).toHaveProperty('id', 'key-2');
      expect(result.secret).toMatch(/^DEV:1:[a-f0-9]{64}$/);
      expect(result.version).toBe(2);
      expect(mockCreate).toHaveBeenCalledWith({
        data: expect.objectContaining({
          previousKeyId: 'key-1',
          version: 2,
        }),
      });
      expect(mockUpdate).toHaveBeenCalledWith({
        where: { id: 'key-1' },
        data: { graceExpiresAt: expect.any(Date) },
      });
    });

    it('should reject rotation of revoked key', async () => {
      (prisma.apiKey.findFirst as jest.Mock) = jest.fn().mockResolvedValue({
        id: 'key-1',
        tenantId: 'tenant-1',
        revokedAt: new Date(),
      });

      await expect(service.rotate('tenant-1', 'key-1', 'user-1')).rejects.toThrow('API key has been revoked');
    });

    it('should reject rotation of expired grace period key', async () => {
      (prisma.apiKey.findFirst as jest.Mock) = jest.fn().mockResolvedValue({
        id: 'key-1',
        tenantId: 'tenant-1',
        revokedAt: null,
        graceExpiresAt: new Date(Date.now() - 86400000),
      });

      await expect(service.rotate('tenant-1', 'key-1', 'user-1')).rejects.toThrow('API key has expired and cannot be rotated');
    });

    it('should reject rotation of nonexistent key', async () => {
      (prisma.apiKey.findFirst as jest.Mock) = jest.fn().mockResolvedValue(null);

      await expect(service.rotate('tenant-1', 'nonexistent', 'user-1')).rejects.toThrow('API key not found');
    });

    it('should audit rotate action', async () => {
      (prisma.apiKey.findFirst as jest.Mock) = jest.fn().mockResolvedValue({
        id: 'key-1',
        tenantId: 'tenant-1',
        userId: 'user-1',
        name: 'Test Key',
        env: 'DEV',
        scopes: [],
        rateLimit: null,
        expiresAt: null,
        version: 1,
        revokedAt: null,
        graceExpiresAt: null,
      });

      (prisma.apiKey.create as jest.Mock) = jest.fn().mockResolvedValue({
        id: 'key-2',
        tenantId: 'tenant-1',
        userId: 'user-1',
        name: 'Test Key',
        env: 'DEV',
        version: 2,
        keyPrefix: 'DEV:1:new',
        keyHash: 'hashed',
        scopes: [],
        rateLimit: null,
        lastUsedAt: null,
        expiresAt: null,
        revokedAt: null,
        previousKeyId: 'key-1',
        graceExpiresAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      (prisma.apiKey.update as jest.Mock) = jest.fn();

      await service.rotate('tenant-1', 'key-1', 'user-1');

      expect(auditService.log).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'api_key.rotate',
          resourceId: 'key-2',
          metadata: expect.objectContaining({
            oldKeyId: 'key-1',
            newKeyId: 'key-2',
            oldVersion: 1,
            newVersion: 2,
          }),
        }),
      );
    });
  });
});
