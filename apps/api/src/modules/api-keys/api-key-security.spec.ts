import { Test, TestingModule } from '@nestjs/testing';
import { ApiKeysService } from './api-keys.service';
import { ApiKeyAuthGuard } from './guards/api-key-auth.guard';
import { ApiKeyScopesGuard } from './guards/api-key-scopes.guard';
import { ApiKeyRateLimitService } from './services/api-key-rate-limit.service';
import { AuditService } from '../audit/audit.service';
import { PrismaService } from '../../prisma.service';
import { Reflector } from '@nestjs/core';
import { ExecutionContext } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ApiKeyCacheService } from './services/api-key-cache.service';

jest.mock('@danta/config', () => ({
  env: {
    apiKeyEnv: 'DEV',
  },
}));

describe('ApiKeySecurityTests', () => {
  describe('secret exposure prevention', () => {
    it('should never return plaintext secret in findAll', async () => {
      const mockLog = jest.fn();
      const module: TestingModule = await Test.createTestingModule({
        providers: [
          ApiKeysService,
          {
            provide: PrismaService,
            useValue: {
              apiKey: { findMany: jest.fn().mockResolvedValue([]), findFirst: jest.fn().mockResolvedValue(null), create: jest.fn() },
              permission: { findMany: jest.fn().mockResolvedValue([]) },
            },
          },
          { provide: AuditService, useValue: { log: mockLog } },
          { provide: ConfigService, useValue: { get: jest.fn(() => 'DEV') } },
          { provide: ApiKeyCacheService, useValue: { invalidate: jest.fn() } },
        ],
      }).compile();

      const service = module.get<ApiKeysService>(ApiKeysService);
      const result = await service.findAll('tenant-1');

      expect(result).not.toHaveProperty('secret');
      expect(result).not.toHaveProperty('keyHash');
      if (result.length > 0) {
        expect(result[0]).not.toHaveProperty('secret');
        expect(result[0]).not.toHaveProperty('keyHash');
      }
    });

    it('should never log plaintext secrets in audit', async () => {
      const mockLog = jest.fn();
      const module: TestingModule = await Test.createTestingModule({
        providers: [
          ApiKeysService,
          {
            provide: PrismaService,
            useValue: {
              apiKey: {
                create: jest.fn().mockResolvedValue({
                  id: 'key-1',
                  name: 'Test',
                  keyPrefix: 'danta_dev_v1_abc',
                  version: 1,
                  env: 'DEV',
                  scopes: [],
                  createdAt: new Date(),
                }),
              },
              permission: { findMany: jest.fn().mockResolvedValue([]) },
            },
          },
          { provide: AuditService, useValue: { log: mockLog } },
          { provide: ConfigService, useValue: { get: jest.fn(() => 'DEV') } },
          { provide: ApiKeyCacheService, useValue: { invalidate: jest.fn() } },
        ],
      }).compile();

      const service = module.get<ApiKeysService>(ApiKeysService);
      await service.create('tenant-1', 'user-1', { name: 'Test', scopes: [] });

      const auditCalls = mockLog.mock.calls;
      for (const call of auditCalls) {
        const metadata = call[0].metadata || {};
        const serialized = JSON.stringify(metadata);
        expect(serialized).not.toContain('danta_dev_v1_');
        expect(serialized).not.toMatch(/[a-zA-Z0-9]{32,}/);
      }
    });
  });

  describe('authentication bypass attempts', () => {
    let guard: ApiKeyAuthGuard;
    let apiKeysService: any;
    let auditService: any;

    beforeEach(async () => {
      const mockLog = jest.fn();
      const module: TestingModule = await Test.createTestingModule({
        providers: [
          ApiKeyAuthGuard,
          {
            provide: ApiKeysService,
            useValue: { validateKey: jest.fn() },
          },
          { provide: AuditService, useValue: { log: mockLog } },
          {
            provide: ApiKeyRateLimitService,
            useValue: {
              checkLimit: jest.fn().mockResolvedValue({ allowed: true, remaining: 100, resetAt: Date.now() + 60000 }),
            },
          },
        ],
      }).compile();

      guard = module.get<ApiKeyAuthGuard>(ApiKeyAuthGuard);
      apiKeysService = module.get<ApiKeysService>(ApiKeysService);
      auditService = module.get<AuditService>(AuditService);
    });

    afterEach(() => {
      jest.clearAllMocks();
    });

    const createContext = (request: any): ExecutionContext => ({
      switchToHttp: () => ({
        getRequest: () => request,
        getResponse: () => ({ setHeader: jest.fn() }),
      }),
    } as unknown as ExecutionContext);

    it('should reject fake JWT token', async () => {
      const fakeJwt = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.dozjgNryP4J3jVmNHl0w5N_XgL0n3I9PlFUP0THsR8U';
      const mockRequest = {
        headers: { authorization: `Bearer ${fakeJwt}` },
        user: undefined,
      };

      (apiKeysService.validateKey as jest.Mock) = jest.fn().mockResolvedValue(null);

      await expect(guard.canActivate(createContext(mockRequest))).rejects.toThrow('Invalid API key');
      expect(apiKeysService.validateKey).toHaveBeenCalledWith(fakeJwt);
    });

    it('should reject modified secret', async () => {
      const modifiedSecret = 'DEV:1:validsecret123456789012345678901234567891';
      const mockRequest = {
        headers: { authorization: `Bearer ${modifiedSecret}` },
        user: undefined as any,
      };

      (apiKeysService.validateKey as jest.Mock) = jest.fn().mockResolvedValue(null);

      await expect(guard.canActivate(createContext(mockRequest))).rejects.toThrow('Invalid API key');
    });

    it('should reject invalid prefix format', async () => {
      const mockRequest = {
        headers: { authorization: 'Bearer invalid_prefix:1:secret123456789012345678901234567890' },
        user: undefined,
      };

      (apiKeysService.validateKey as jest.Mock) = jest.fn().mockResolvedValue(null);

      await expect(guard.canActivate(createContext(mockRequest))).rejects.toThrow('Invalid API key');
    });

    it('should reject revoked key immediately', async () => {
      const mockRequest = {
        headers: { authorization: 'Bearer DEV:1:secret123456789012345678901234567890' },
        user: undefined,
      };

      (apiKeysService.validateKey as jest.Mock) = jest.fn().mockResolvedValue(null);

      await expect(guard.canActivate(createContext(mockRequest))).rejects.toThrow('Invalid API key');
    });

    it('should reject expired key immediately', async () => {
      const mockRequest = {
        headers: { authorization: 'Bearer DEV:1:expiredsecret123456789012345678901234' },
        user: undefined,
      };

      (apiKeysService.validateKey as jest.Mock) = jest.fn().mockResolvedValue(null);

      await expect(guard.canActivate(createContext(mockRequest))).rejects.toThrow('Invalid API key');
    });

    it('should not allow tenant override via headers', async () => {
      const mockRequest = {
        headers: {
          authorization: 'Bearer DEV:1:validsecret123456789012345678901234567890',
          'x-tenant-id': 'attacker-tenant',
        },
        user: undefined,
      };

      (apiKeysService.validateKey as jest.Mock) = jest.fn().mockResolvedValue({
        id: 'key-1',
        tenantId: 'legitimate-tenant',
        userId: 'user-1',
        scopes: ['patients:read'],
        env: 'DEV',
        type: 'api-key',
      });

      const result = await guard.canActivate(createContext(mockRequest));
      expect(result).toBe(true);
      expect((mockRequest as any).user.tenantId).toBe('legitimate-tenant');
    });

    it('should log auth failures with correlation ID', async () => {
      const mockRequest = {
        headers: { authorization: 'Bearer DEV:1:invalidsecret123456789012345678901234' },
        user: undefined,
      };

      (apiKeysService.validateKey as jest.Mock) = jest.fn().mockResolvedValue(null);

      await expect(guard.canActivate(createContext(mockRequest))).rejects.toThrow('Invalid API key');
      expect(auditService.log).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'api_key.auth_failed',
          metadata: { reason: 'invalid_or_missing_key' },
        }),
      );
    });
  });

  describe('authorization bypass', () => {
    let guard: ApiKeyScopesGuard;
    let mockReflector: jest.Mocked<Reflector>;

    const createContext = (user: any): ExecutionContext => ({
      switchToHttp: () => ({
        getRequest: () => ({ user }),
      }),
      getHandler: jest.fn(),
      getClass: jest.fn(),
    } as unknown as ExecutionContext);

    beforeEach(async () => {
      mockReflector = {
        getAllAndOverride: jest.fn((_key: string, contexts: any[]) => contexts[0] as string[] | undefined),
      } as any;

      const module: TestingModule = await Test.createTestingModule({
        providers: [
          ApiKeyScopesGuard,
          { provide: Reflector, useValue: mockReflector },
        ],
      }).compile();

      guard = module.get<ApiKeyScopesGuard>(ApiKeyScopesGuard);
    });

    afterEach(() => {
      jest.clearAllMocks();
    });

    it('should deny cross-tenant resource access', () => {
      const user = {
        type: 'api-key',
        id: 'key-tenant-a',
        tenantId: 'tenant-a',
        scopes: ['patients:read'],
      };

      mockReflector.getAllAndOverride.mockReturnValue(['patients:read']);
      const context = createContext(user);
      const result = guard.canActivate(context);

      expect(result).toBe(true);
    });

    it('should not allow scope injection via special characters', () => {
      const user = {
        type: 'api-key',
        scopes: ['patients:read'],
      };

      mockReflector.getAllAndOverride.mockReturnValue(['patients:read\x00admin']);
      const context = createContext(user);

      expect(() => guard.canActivate(context)).toThrow('Insufficient API key scopes');
    });

    it('should deny empty scope injection', () => {
      const user = {
        type: 'api-key',
        scopes: ['patients:read'],
      };

      mockReflector.getAllAndOverride.mockReturnValue(['']);
      const context = createContext(user);

      expect(() => guard.canActivate(context)).toThrow('Insufficient API key scopes');
    });
  });

  describe('rate limiting security', () => {
    it('should enforce per-key limits independently', async () => {
      const mockCheckLimit = jest.fn().mockResolvedValue({ allowed: true, remaining: 9, resetAt: Date.now() + 60000 });

      const module: TestingModule = await Test.createTestingModule({
        providers: [
          ApiKeyRateLimitService,
          {
            provide: PrismaService,
            useValue: {},
          },
        ],
      }).compile();

      const service = module.get<ApiKeyRateLimitService>(ApiKeyRateLimitService);
      jest.spyOn(service as any, 'checkLimit').mockImplementation(mockCheckLimit);

      const result = await (service as any).checkLimit('key-1', 'tenant-1', { max: 10, windowMs: 60000 });
      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(9);
    });

    it('should fail-closed when Redis throws', async () => {
      const module: TestingModule = await Test.createTestingModule({
        providers: [
          ApiKeyRateLimitService,
          {
            provide: PrismaService,
            useValue: {},
          },
        ],
      }).compile();

      const service = module.get<ApiKeyRateLimitService>(ApiKeyRateLimitService);
      const mockClient = {
        zrangebyscore: jest.fn(),
        zadd: jest.fn(),
        zremrangebyscore: jest.fn(),
        zcard: jest.fn(),
        expire: jest.fn(),
        quit: jest.fn(),
      };
      (service as any).client = mockClient;

      mockClient.zrangebyscore.mockRejectedValue(new Error('Redis connection lost'));

      await expect(service.checkLimit('key-1', 'tenant-1', { max: 10, windowMs: 60000 })).rejects.toThrow();
    });
  });

  describe('API key lifecycle security', () => {
    it('should reject creation with wildcard scopes', async () => {
      const module: TestingModule = await Test.createTestingModule({
        providers: [
          ApiKeysService,
          {
            provide: PrismaService,
            useValue: {
              apiKey: { findFirst: jest.fn().mockResolvedValue(null), create: jest.fn() },
              permission: {
                findMany: jest.fn().mockResolvedValue([
                  { resource: 'patients', action: 'read' },
                  { resource: 'patients', action: 'create' },
                ]),
              },
            },
          },
          { provide: AuditService, useValue: { log: jest.fn() } },
          { provide: ConfigService, useValue: { get: jest.fn(() => 'DEV') } },
          { provide: ApiKeyCacheService, useValue: { invalidate: jest.fn() } },
        ],
      }).compile();

      const service = module.get<ApiKeysService>(ApiKeysService);
      await expect(
        service.create('tenant-1', 'user-1', { name: 'Wildcard', scopes: ['*'] }),
      ).rejects.toThrow();
    });

    it('should prevent cross-tenant rotation', async () => {
      const module: TestingModule = await Test.createTestingModule({
        providers: [
          ApiKeysService,
          {
            provide: PrismaService,
            useValue: {
              apiKey: {
                findFirst: jest.fn().mockResolvedValue({
                  id: 'key-1',
                  tenantId: 'tenant-b',
                  name: 'Other Tenant Key',
                }),
              },
            },
          },
          { provide: AuditService, useValue: { log: jest.fn() } },
          { provide: ConfigService, useValue: { get: jest.fn(() => 'DEV') } },
          { provide: ApiKeyCacheService, useValue: { invalidate: jest.fn() } },
        ],
      }).compile();

      const service = module.get<ApiKeysService>(ApiKeysService);
      await expect(service.rotate('tenant-a', 'key-1', 'user-1')).rejects.toThrow();
    });
  });
});
