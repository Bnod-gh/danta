import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { AuditService } from '../audit/audit.service';
import { InvitationsService } from '../invitations/invitations.service';
import { UnauthorizedException } from '@nestjs/common';
import { Request, Response } from 'express';

describe('AuthController', () => {
  let controller: AuthController;
  let authService: jest.Mocked<AuthService>;
  let auditService: jest.Mocked<AuditService>;
  let invitationsService: jest.Mocked<InvitationsService>;

  beforeEach(async () => {
    const mockAuthService = {
      me: jest.fn(),
      validateUser: jest.fn(),
      login: jest.fn(),
      register: jest.fn(),
      refresh: jest.fn(),
      logout: jest.fn(),
    };

    const mockAuditService = {
      log: jest.fn(),
    };

    const mockInvitationsService = {
      accept: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        { provide: AuthService, useValue: mockAuthService },
        { provide: AuditService, useValue: mockAuditService },
        { provide: InvitationsService, useValue: mockInvitationsService },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    authService = module.get(AuthService);
    auditService = module.get(AuditService);
    invitationsService = module.get(InvitationsService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('login', () => {
    it('should log audit failure on invalid credentials', async () => {
      authService.validateUser.mockResolvedValue(null);
      const req = { ip: '127.0.0.1', headers: {} } as Request;
      const res = {} as Response;
      
      await expect(controller.login(req, res, { email: 'test@example.com', password: 'wrong' })).rejects.toThrow(UnauthorizedException);
      expect(auditService.log).toHaveBeenCalledWith(expect.objectContaining({ result: 'failure' }));
    });
  });

  describe('register', () => {
    it('should call invitationsService.accept and authService.login', async () => {
      const mockUser = { id: '1', email: 'test@example.com', role: 'admin' as any, tenantId: 't1', passwordHash: 'hash', firstName: 'test', lastName: 'test', status: 'active', createdAt: new Date(), updatedAt: new Date(), organisationId: null, practiceId: null, locationId: null, deletedAt: null };
      invitationsService.accept.mockResolvedValue(mockUser);
      authService.login.mockResolvedValue({ message: 'Logged in successfully' } as any);
      
      const res = {} as Response;
      await controller.register(res, { email: 'test@example.com', password: 'password', firstName: 'test', lastName: 'test', inviteToken: 'token' });
      
      expect(invitationsService.accept).toHaveBeenCalled();
      expect(authService.login).toHaveBeenCalled();
    });
  });

  describe('refresh', () => {
    it('should extract cookie or body token', async () => {
      authService.refresh.mockResolvedValue({ message: 'Tokens refreshed' } as any);
      const req = { cookies: { refreshToken: 'cookie-token' } } as unknown as Request;
      const res = {} as Response;
      
      await controller.refresh(req, res);
      expect(authService.refresh).toHaveBeenCalledWith('cookie-token', res);
    });
  });
});
