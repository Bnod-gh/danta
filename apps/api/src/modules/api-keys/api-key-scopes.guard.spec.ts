import { Test, TestingModule } from '@nestjs/testing';
import { ApiKeyScopesGuard } from './guards/api-key-scopes.guard';
import { Reflector } from '@nestjs/core';
import { ExecutionContext } from '@nestjs/common';

describe('ApiKeyScopesGuard', () => {
  let guard: ApiKeyScopesGuard;
  let mockReflector: jest.Mocked<Reflector>;

  const createContext = (user: any): ExecutionContext => {
    return {
      switchToHttp: () => ({
        getRequest: () => ({
          user,
        }),
      }),
      getHandler: jest.fn(),
      getClass: jest.fn(),
    } as unknown as ExecutionContext;
  };

  beforeEach(async () => {
    mockReflector = {
      getAllAndOverride: jest.fn((_key: string, contexts: any[]) => {
        return contexts[0] as string[] | undefined;
      }),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ApiKeyScopesGuard,
        {
          provide: Reflector,
          useValue: mockReflector,
        },
      ],
    }).compile();

    guard = module.get<ApiKeyScopesGuard>(ApiKeyScopesGuard);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('API key with sufficient scopes', () => {
    it('should allow access when API key has required scope', () => {
      const user = {
        type: 'api-key',
        scopes: ['patients:read', 'appointments:read'],
      };

      mockReflector.getAllAndOverride.mockReturnValue(['patients:read']);
      const context = createContext(user);
      const result = guard.canActivate(context);

      expect(result).toBe(true);
    });

    it('should allow access when multiple scopes required and all present', () => {
      const user = {
        type: 'api-key',
        scopes: ['patients:read', 'appointments:read', 'billing:read'],
      };

      mockReflector.getAllAndOverride.mockReturnValue(['patients:read', 'appointments:read']);
      const context = createContext(user);
      const result = guard.canActivate(context);

      expect(result).toBe(true);
    });
  });

  describe('API key with insufficient scopes', () => {
    it('should deny access when API key lacks required scope', () => {
      const user = {
        type: 'api-key',
        scopes: ['patients:read'],
      };

      mockReflector.getAllAndOverride.mockReturnValue(['appointments:read']);
      const context = createContext(user);

      expect(() => guard.canActivate(context)).toThrow('Insufficient API key scopes');
    });

    it('should deny read access when key only has write scope', () => {
      const user = {
        type: 'api-key',
        scopes: ['patients:write'],
      };

      mockReflector.getAllAndOverride.mockReturnValue(['patients:read']);
      const context = createContext(user);

      expect(() => guard.canActivate(context)).toThrow('Insufficient API key scopes');
    });

    it('should deny write access when key only has read scope', () => {
      const user = {
        type: 'api-key',
        scopes: ['patients:read'],
      };

      mockReflector.getAllAndOverride.mockReturnValue(['patients:write']);
      const context = createContext(user);

      expect(() => guard.canActivate(context)).toThrow('Insufficient API key scopes');
    });

    it('should deny delete access when key only has read scope', () => {
      const user = {
        type: 'api-key',
        scopes: ['patients:read'],
      };

      mockReflector.getAllAndOverride.mockReturnValue(['patients:delete']);
      const context = createContext(user);

      expect(() => guard.canActivate(context)).toThrow('Insufficient API key scopes');
    });
  });

  describe('wildcard rejection', () => {
    it('should deny wildcard scope requirement', () => {
      const user = {
        type: 'api-key',
        scopes: ['patients:read', 'appointments:read', 'billing:read'],
      };

      mockReflector.getAllAndOverride.mockReturnValue(['*']);
      const context = createContext(user);

      expect(() => guard.canActivate(context)).toThrow('Insufficient API key scopes');
    });

    it('should deny resource wildcard scope requirement', () => {
      const user = {
        type: 'api-key',
        scopes: ['patients:read', 'patients:write', 'patients:delete'],
      };

      mockReflector.getAllAndOverride.mockReturnValue(['patients:*']);
      const context = createContext(user);

      expect(() => guard.canActivate(context)).toThrow('Insufficient API key scopes');
    });
  });

  describe('non-API key users', () => {
    it('should allow JWT-authenticated users to pass', () => {
      const user = {
        type: 'user',
        id: 'user-1',
        email: 'test@example.com',
      };

      mockReflector.getAllAndOverride.mockReturnValue(['patients:read']);
      const context = createContext(user);
      const result = guard.canActivate(context);

      expect(result).toBe(true);
    });

    it('should allow unauthenticated requests when no scopes required', () => {
      mockReflector.getAllAndOverride.mockReturnValue(undefined);
      const context = createContext(null);
      const result = guard.canActivate(context);

      expect(result).toBe(true);
    });
  });

  describe('no scopes required', () => {
    it('should allow API key access when no scopes required', () => {
      const user = {
        type: 'api-key',
        scopes: ['patients:read'],
      };

      mockReflector.getAllAndOverride.mockReturnValue(undefined);
      const context = createContext(user);
      const result = guard.canActivate(context);

      expect(result).toBe(true);
    });

    it('should allow API key access when empty scopes array required', () => {
      const user = {
        type: 'api-key',
        scopes: ['patients:read'],
      };

      mockReflector.getAllAndOverride.mockReturnValue([]);
      const context = createContext(user);
      const result = guard.canActivate(context);

      expect(result).toBe(true);
    });
  });

  describe('scope escalation prevention', () => {
    it('should prevent read-to-write escalation', () => {
      const user = {
        type: 'api-key',
        scopes: ['patients:read'],
      };

      mockReflector.getAllAndOverride.mockReturnValue(['patients:write']);
      const context = createContext(user);

      expect(() => guard.canActivate(context)).toThrow('Insufficient API key scopes');
    });

    it('should prevent read-to-delete escalation', () => {
      const user = {
        type: 'api-key',
        scopes: ['patients:read'],
      };

      mockReflector.getAllAndOverride.mockReturnValue(['patients:delete']);
      const context = createContext(user);

      expect(() => guard.canActivate(context)).toThrow('Insufficient API key scopes');
    });

    it('should prevent cross-resource escalation', () => {
      const user = {
        type: 'api-key',
        scopes: ['patients:read'],
      };

      mockReflector.getAllAndOverride.mockReturnValue(['billing:read']);
      const context = createContext(user);

      expect(() => guard.canActivate(context)).toThrow('Insufficient API key scopes');
    });

    it('should allow same-scope access for different resources', () => {
      const user = {
        type: 'api-key',
        scopes: ['patients:read', 'appointments:read'],
      };

      mockReflector.getAllAndOverride.mockReturnValue(['appointments:read']);
      const context = createContext(user);
      const result = guard.canActivate(context);

      expect(result).toBe(true);
    });
  });
});
