import { Test } from '@nestjs/testing';
import { LoginAttemptService } from './services/login-attempt.service';
import { PrismaService } from '../../prisma.service';

describe('LoginAttemptService', () => {
  let service: LoginAttemptService;
  let prisma: PrismaService;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        LoginAttemptService,
        {
          provide: PrismaService,
          useValue: {
            loginAttempt: {
              upsert: jest.fn(),
              findUnique: jest.fn(),
              update: jest.fn(),
              deleteMany: jest.fn(),
            },
          },
        },
      ],
    }).compile();

    service = module.get<LoginAttemptService>(LoginAttemptService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('recordAttempt', () => {
    it('should create a new attempt record on failure', async () => {
      const mockUpsert = jest.fn().mockResolvedValue({
        email: 'login:test@example.com',
        attempts: 1,
        lockedUntil: null,
        lastAttemptAt: new Date(),
      });

      (prisma.loginAttempt.upsert as jest.Mock) = mockUpsert;

      await service.recordAttempt('test@example.com', false);

      expect(mockUpsert).toHaveBeenCalledWith({
        where: { email: 'login:test@example.com' },
        create: {
          email: 'login:test@example.com',
          attempts: 1,
          lastAttemptAt: expect.anything(),
        },
        update: {
          attempts: { increment: 1 },
          lastAttemptAt: expect.anything(),
        },
      });
    });

    it('should reset attempts on successful login', async () => {
      const mockUpsert = jest.fn().mockResolvedValue({
        email: 'login:test@example.com',
        attempts: 0,
        lockedUntil: null,
        lastAttemptAt: new Date(),
      });

      (prisma.loginAttempt.upsert as jest.Mock) = mockUpsert;

      await service.recordAttempt('test@example.com', true);

      expect(mockUpsert).toHaveBeenCalledWith({
        where: { email: 'login:test@example.com' },
        create: {
          email: 'login:test@example.com',
          attempts: 0,
          lastAttemptAt: expect.anything(),
        },
        update: {
          attempts: 0,
          lockedUntil: null,
          lastAttemptAt: expect.anything(),
        },
      });
    });
  });

  describe('isLocked', () => {
    it('should return false when no record exists', async () => {
      (prisma.loginAttempt.findUnique as jest.Mock) = jest.fn().mockResolvedValue(null);

      const result = await service.isLocked('test@example.com');
      expect(result).toBe(false);
    });

    it('should return false when lockedUntil is null', async () => {
      (prisma.loginAttempt.findUnique as jest.Mock) = jest.fn().mockResolvedValue({
        email: 'login:test@example.com',
        lockedUntil: null,
      });

      const result = await service.isLocked('test@example.com');
      expect(result).toBe(false);
    });

    it('should return true when lockedUntil is in the future', async () => {
      const futureDate = new Date(Date.now() + 60000);
      (prisma.loginAttempt.findUnique as jest.Mock) = jest.fn().mockResolvedValue({
        email: 'login:test@example.com',
        lockedUntil: futureDate,
      });

      const result = await service.isLocked('test@example.com');
      expect(result).toBe(true);
    });

    it('should reset and return false when lockedUntil is in the past', async () => {
      const pastDate = new Date(Date.now() - 60000);
      const mockUpdate = jest.fn().mockResolvedValue({
        email: 'login:test@example.com',
        attempts: 0,
        lockedUntil: null,
      });

      (prisma.loginAttempt.findUnique as jest.Mock) = jest.fn().mockResolvedValue({
        email: 'login:test@example.com',
        lockedUntil: pastDate,
      });
      (prisma.loginAttempt.update as jest.Mock) = mockUpdate;

      const result = await service.isLocked('test@example.com');
      expect(result).toBe(false);
      expect(mockUpdate).toHaveBeenCalledWith({
        where: { email: 'login:test@example.com' },
        data: { attempts: 0, lockedUntil: null },
      });
    });

    it('should still work after cleanup removes old record', async () => {
      (prisma.loginAttempt.findUnique as jest.Mock) = jest.fn().mockResolvedValue(null);

      const result = await service.isLocked('test@example.com');
      expect(result).toBe(false);
    });
  });
});
