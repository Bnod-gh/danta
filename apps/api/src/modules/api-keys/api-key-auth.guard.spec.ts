import { Test, TestingModule } from '@nestjs/testing';
import { ApiKeyAuthGuard } from './guards/api-key-auth.guard';
import { ApiKeysService } from './api-keys.service';
import { AuditService } from '../audit/audit.service';
import { ApiKeyRateLimitService } from './services/api-key-rate-limit.service';
import { ExecutionContext, HttpException } from '@nestjs/common';

describe('ApiKeyAuthGuard', () => {
  let guard: ApiKeyAuthGuard;
  let apiKeysService: ApiKeysService;
  let auditService: AuditService;
  let rateLimitService: ApiKeyRateLimitService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ApiKeyAuthGuard,
        {
          provide: ApiKeysService,
          useValue: {
            validateKey: jest.fn(),
          },
        },
        {
          provide: AuditService,
          useValue: {
            log: jest.fn(),
          },
        },
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
    rateLimitService = module.get<ApiKeyRateLimitService>(ApiKeyRateLimitService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  const createContext = (request: any): ExecutionContext => {
    return {
      switchToHttp: () => ({
        getRequest: () => request,
        getResponse: () => ({
          setHeader: jest.fn(),
        }),
      }),
    } as unknown as ExecutionContext;
  };

  describe('valid key', () => {
    it('should allow access and set typed identity', async () => {
      const mockRequest = {
        headers: {
          authorization: 'Bearer DEV:1:validsecret123456789012345678901234567890',
        },
        user: undefined,
      };

      (apiKeysService.validateKey as jest.Mock) = jest.fn().mockResolvedValue({
        id: 'key-1',
        tenantId: 'tenant-1',
        userId: 'user-1',
        scopes: ['patients:read'],
        env: 'DEV',
        type: 'api-key',
      });

      const context = createContext(mockRequest);

      const result = await guard.canActivate(context);

      expect(result).toBe(true);
      expect(mockRequest.user).toEqual({
        id: 'key-1',
        tenantId: 'tenant-1',
        userId: 'user-1',
        scopes: ['patients:read'],
        env: 'DEV',
        type: 'api-key',
      });
    });
  });

  describe('missing key', () => {
    it('should throw ForbiddenException when no Authorization header', async () => {
      const mockRequest = {
        headers: {},
      };

      const context = createContext(mockRequest);

      await expect(guard.canActivate(context)).rejects.toThrow('Missing API key');
    });

    it('should throw ForbiddenException when Authorization header does not start with Bearer', async () => {
      const mockRequest = {
        headers: {
          authorization: 'Basic dXNlcjpwYXNz',
        },
      };

      const context = createContext(mockRequest);

      await expect(guard.canActivate(context)).rejects.toThrow('Missing API key');
    });
  });

  describe('invalid key', () => {
    it('should throw ForbiddenException for invalid secret', async () => {
      const mockRequest = {
        headers: {
          authorization: 'Bearer DEV:1:invalidsecret123456789012345678901234567890',
        },
        user: undefined,
      };

      (apiKeysService.validateKey as jest.Mock) = jest.fn().mockResolvedValue(null);

      const context = createContext(mockRequest);

      await expect(guard.canActivate(context)).rejects.toThrow('Invalid API key');
      expect(auditService.log).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'api_key.auth_failed',
          metadata: { reason: 'invalid_or_missing_key' },
        }),
      );
    });
  });

  describe('malformed key', () => {
    it('should throw ForbiddenException for too-short secret', async () => {
      const mockRequest = {
        headers: {
          authorization: 'Bearer short',
        },
        user: undefined,
      };

      const context = createContext(mockRequest);

      await expect(guard.canActivate(context)).rejects.toThrow('Invalid API key');
    });
  });

  describe('tenant isolation', () => {
    it('should derive tenant from API key, not request', async () => {
      const mockRequest = {
        headers: {
          authorization: 'Bearer DEV:1:validsecret123456789012345678901234567890',
        },
        user: undefined,
      };

      (apiKeysService.validateKey as jest.Mock) = jest.fn().mockResolvedValue({
        id: 'key-1',
        tenantId: 'tenant-from-key',
        userId: 'user-1',
        scopes: ['patients:read'],
        env: 'DEV',
        type: 'api-key',
      });

      const context = createContext(mockRequest);

      const result = await guard.canActivate(context);

      expect(result).toBe(true);
      expect((mockRequest as any).user.tenantId).toBe('tenant-from-key');
    });
  });

  describe('rate limiting', () => {
    it('should allow access when under rate limit', async () => {
      const mockRequest = {
        headers: {
          authorization: 'Bearer DEV:1:validsecret123456789012345678901234567890',
        },
        user: undefined,
      };

      (apiKeysService.validateKey as jest.Mock) = jest.fn().mockResolvedValue({
        id: 'key-1',
        tenantId: 'tenant-1',
        userId: 'user-1',
        scopes: ['patients:read'],
        env: 'DEV',
        rateLimit: { max: 100, windowMs: 60000 },
        type: 'api-key',
      });

      const mockResponse = {
        setHeader: jest.fn(),
      };

      const context = {
        switchToHttp: () => ({
          getRequest: () => mockRequest,
          getResponse: () => mockResponse,
        }),
      } as unknown as ExecutionContext;

      const result = await guard.canActivate(context);

      expect(result).toBe(true);
      expect(mockResponse.setHeader).toHaveBeenCalledWith('X-RateLimit-Limit', 100);
      expect(mockResponse.setHeader).toHaveBeenCalledWith('X-RateLimit-Remaining', 100);
      expect(mockResponse.setHeader).toHaveBeenCalledWith('X-RateLimit-Reset', expect.any(Number));
    });

    it('should reject with 429 when rate limit exceeded', async () => {
      const mockRequest = {
        headers: {
          authorization: 'Bearer DEV:1:validsecret123456789012345678901234567890',
        },
        user: undefined,
      };

      (apiKeysService.validateKey as jest.Mock) = jest.fn().mockResolvedValue({
        id: 'key-1',
        tenantId: 'tenant-1',
        userId: 'user-1',
        scopes: ['patients:read'],
        env: 'DEV',
        rateLimit: { max: 1, windowMs: 60000 },
        type: 'api-key',
      });

      (rateLimitService.checkLimit as jest.Mock) = jest.fn().mockResolvedValue({
        allowed: false,
        remaining: 0,
        resetAt: Date.now() + 60000,
        retryAfter: 60,
      });

      const mockResponse = {
        setHeader: jest.fn(),
      };

      const context = {
        switchToHttp: () => ({
          getRequest: () => mockRequest,
          getResponse: () => mockResponse,
        }),
      } as unknown as ExecutionContext;

      await expect(guard.canActivate(context)).rejects.toThrow('Rate limit exceeded');
      expect(mockResponse.setHeader).toHaveBeenCalledWith('Retry-After', 60);
    });

    it('should reject with 503 when Redis is unavailable', async () => {
      const mockRequest = {
        headers: {
          authorization: 'Bearer DEV:1:validsecret123456789012345678901234567890',
        },
        user: undefined,
      };

      (apiKeysService.validateKey as jest.Mock) = jest.fn().mockResolvedValue({
        id: 'key-1',
        tenantId: 'tenant-1',
        userId: 'user-1',
        scopes: ['patients:read'],
        env: 'DEV',
        rateLimit: { max: 100, windowMs: 60000 },
        type: 'api-key',
      });

      (rateLimitService.checkLimit as jest.Mock) = jest.fn().mockRejectedValue(
        new HttpException('Rate limit service unavailable', 503),
      );

      const context = createContext(mockRequest);

      await expect(guard.canActivate(context)).rejects.toThrow('Rate limit service unavailable');
    });
  });

  describe('authentication bypass', () => {
    it('should not allow empty Bearer token', async () => {
      const mockRequest = {
        headers: {
          authorization: 'Bearer ',
        },
        user: undefined,
      };

      const context = createContext(mockRequest);

      await expect(guard.canActivate(context)).rejects.toThrow('Invalid API key');
    });

    it('should not allow fake JWT as API key', async () => {
      const fakeJwt = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.fake.signature';
      const mockRequest = {
        headers: {
          authorization: `Bearer ${fakeJwt}`,
        },
        user: undefined,
      };

      (apiKeysService.validateKey as jest.Mock) = jest.fn().mockResolvedValue(null);

      const context = createContext(mockRequest);

      await expect(guard.canActivate(context)).rejects.toThrow('Invalid API key');
    });
  });
});
