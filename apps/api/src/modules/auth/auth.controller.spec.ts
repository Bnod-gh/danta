import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { AuditService } from '../audit/audit.service';

describe('AuthController', () => {
  let app: INestApplication;
  let authController: AuthController;
  let authService: AuthService;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: {
            validateUser: jest.fn(),
            login: jest.fn(),
            register: jest.fn(),
            refresh: jest.fn(),
            logout: jest.fn(),
          },
        },
        {
          provide: AuditService,
          useValue: {
            log: jest.fn(),
          },
        },
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    authController = moduleFixture.get<AuthController>(AuthController);
    authService = moduleFixture.get<AuthService>(AuthService);
  });

  afterEach(async () => {
    if (app) {
      await app.close();
    }
  });

  describe('login', () => {
    it('should return tokens on successful login', async () => {
      jest.spyOn(authService, 'validateUser').mockResolvedValue({ id: 'user-1', email: 'owner@danta.demo', role: 'owner', tenantId: 'tenant-1' } as any);
      jest.spyOn(authService, 'login').mockResolvedValue({
        accessToken: 'mock-access-token',
        refreshToken: 'mock-refresh-token',
      } as any);

      const result = await authController.login({} as any, { email: 'owner@danta.demo', password: 'Password123!' } as any);

      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
      expect(authService.validateUser).toHaveBeenCalledWith('owner@danta.demo', 'Password123!');
    });
  });

  describe('register', () => {
    it('should register a new user and return tokens', async () => {
      jest.spyOn(authService, 'register').mockResolvedValue({
        accessToken: 'mock-access-token',
        refreshToken: 'mock-refresh-token',
      } as any);

      const result = await authController.register({
        email: 'new@test.com',
        password: 'SecurePass123!',
        firstName: 'Test',
        lastName: 'User',
        tenantId: 'tenant-1',
        role: 'patient',
      } as any);

      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
    });
  });

  describe('refresh', () => {
    it('should return new tokens on valid refresh', async () => {
      jest.spyOn(authService, 'refresh').mockResolvedValue({
        accessToken: 'new-access-token',
        refreshToken: 'new-refresh-token',
      } as any);

      const result = await authController.refresh({ refreshToken: 'valid-refresh-token' } as any);

      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
    });
  });

  describe('logout', () => {
    it('should logout successfully', async () => {
      jest.spyOn(authService, 'logout').mockResolvedValue({ message: 'Logged out successfully' } as any);

      const mockReq = {
        ip: '127.0.0.1',
        headers: { 'user-agent': 'test-agent' },
      };

      const mockUser = {
        id: 'user-1',
        email: 'owner@danta.demo',
        role: 'owner',
        tenantId: 'tenant-1',
        practiceId: 'practice-1',
        locationId: 'location-1',
        status: 'active',
      };

      const result = await authController.logout(mockReq as any, mockUser, { refreshToken: 'refresh-token' } as any);

      expect(result).toEqual({ message: 'Logged out successfully' });
    });
  });
});
