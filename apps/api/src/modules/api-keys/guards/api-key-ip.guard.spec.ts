import { Test, TestingModule } from '@nestjs/testing';
import { ApiKeyIpGuard } from './api-key-ip.guard';
import { ExecutionContext } from '@nestjs/common';

describe('ApiKeyIpGuard', () => {
  let guard: ApiKeyIpGuard;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ApiKeyIpGuard],
    }).compile();

    guard = module.get<ApiKeyIpGuard>(ApiKeyIpGuard);
  });

  const createContext = (request: any): ExecutionContext => {
    return {
      switchToHttp: () => ({
        getRequest: () => request,
      }),
    } as unknown as ExecutionContext;
  };

  describe('non-api-key requests', () => {
    it('should allow JWT-authenticated requests', () => {
      const mockRequest = {
        user: { type: 'jwt', id: 'user-1' },
        ip: '192.168.1.1',
        headers: {},
      };

      const result = guard.canActivate(createContext(mockRequest));
      expect(result).toBe(true);
    });

    it('should allow unauthenticated requests', () => {
      const mockRequest = {
        user: undefined,
        ip: '192.168.1.1',
        headers: {},
      };

      const result = guard.canActivate(createContext(mockRequest));
      expect(result).toBe(true);
    });
  });

  describe('api-key requests with no ipAllowlist', () => {
    it('should allow when ipAllowlist is null', () => {
      const mockRequest = {
        user: { type: 'api-key', id: 'key-1', ipAllowlist: null },
        ip: '192.168.1.1',
        headers: {},
      };

      const result = guard.canActivate(createContext(mockRequest));
      expect(result).toBe(true);
    });

    it('should allow when ipAllowlist is undefined', () => {
      const mockRequest = {
        user: { type: 'api-key', id: 'key-1' },
        ip: '192.168.1.1',
        headers: {},
      };

      const result = guard.canActivate(createContext(mockRequest));
      expect(result).toBe(true);
    });
  });

  describe('api-key requests with empty ipAllowlist', () => {
    it('should deny when ipAllowlist is empty array', () => {
      const mockRequest = {
        user: { type: 'api-key', id: 'key-1', ipAllowlist: [] },
        ip: '192.168.1.1',
        headers: {},
      };

      expect(() => guard.canActivate(createContext(mockRequest))).toThrow('API key IP allowlist is empty');
    });
  });

  describe('api-key requests with ipAllowlist', () => {
    it('should allow when IP is in allowlist', () => {
      const mockRequest = {
        user: { type: 'api-key', id: 'key-1', ipAllowlist: ['192.168.1.0/24'] },
        ip: '192.168.1.50',
        headers: {},
      };

      const result = guard.canActivate(createContext(mockRequest));
      expect(result).toBe(true);
    });

    it('should deny when IP is not in allowlist', () => {
      const mockRequest = {
        user: { type: 'api-key', id: 'key-1', ipAllowlist: ['192.168.1.0/24'] },
        ip: '10.0.0.1',
        headers: {},
      };

      expect(() => guard.canActivate(createContext(mockRequest))).toThrow('IP address not allowed for this API key');
    });

    it('should allow exact IP match', () => {
      const mockRequest = {
        user: { type: 'api-key', id: 'key-1', ipAllowlist: ['203.0.113.50/32'] },
        ip: '203.0.113.50',
        headers: {},
      };

      const result = guard.canActivate(createContext(mockRequest));
      expect(result).toBe(true);
    });

    it('should support IPv6 allowlist', () => {
      const mockRequest = {
        user: { type: 'api-key', id: 'key-1', ipAllowlist: ['2001:db8::/32'] },
        ip: '2001:db8::1',
        headers: {},
      };

      const result = guard.canActivate(createContext(mockRequest));
      expect(result).toBe(true);
    });

    it('should support multiple CIDR ranges', () => {
      const mockRequest = {
        user: { type: 'api-key', id: 'key-1', ipAllowlist: ['192.168.1.0/24', '10.0.0.0/8'] },
        ip: '10.0.0.50',
        headers: {},
      };

      const result = guard.canActivate(createContext(mockRequest));
      expect(result).toBe(true);
    });
  });

  describe('trusted proxy handling', () => {
    it('should trust X-Forwarded-For from trusted proxy', () => {
      const mockRequest = {
        user: { type: 'api-key', id: 'key-1', ipAllowlist: ['192.168.1.0/24'] },
        headers: {
          'x-forwarded-for': '192.168.1.50, 10.0.0.1',
        },
        ip: '10.0.0.1',
        connection: { remoteAddress: '10.0.0.1' },
        socket: { remoteAddress: '10.0.0.1' },
      };

      const result = guard.canActivate(createContext(mockRequest));
      expect(result).toBe(true);
    });

    it('should not trust X-Forwarded-For from untrusted proxy', () => {
      const mockRequest = {
        user: { type: 'api-key', id: 'key-1', ipAllowlist: ['192.168.1.0/24'] },
        headers: {
          'x-forwarded-for': '192.168.1.50, 203.0.113.1',
        },
        ip: '203.0.113.1',
        connection: { remoteAddress: '203.0.113.1' },
        socket: { remoteAddress: '203.0.113.1' },
      };

      expect(() => guard.canActivate(createContext(mockRequest))).toThrow('IP address not allowed for this API key');
    });
  });
});
