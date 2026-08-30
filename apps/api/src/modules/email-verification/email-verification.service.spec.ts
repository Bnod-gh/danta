import { EmailVerificationService } from './email-verification.service';

jest.mock('bcryptjs', () => ({
  compare: jest.fn().mockResolvedValue(true),
  hash: jest.fn().mockResolvedValue('hashed'),
}));

describe('EmailVerificationService', () => {
  const prisma = {
    user: { findFirst: jest.fn(), update: jest.fn() },
    emailVerificationToken: { create: jest.fn(), findFirst: jest.fn(), update: jest.fn() },
  };
  const auditService = { log: jest.fn().mockResolvedValue(undefined) };
  const configService = { get: jest.fn().mockReturnValue('test-secret') };

  let service: EmailVerificationService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new EmailVerificationService(prisma as any, auditService as any, configService as any);
  });

  it('does not return the raw token in the resend response', async () => {
    prisma.user.findFirst.mockResolvedValue({ id: 'user-1', tenantId: 'tenant-1' });
    prisma.emailVerificationToken.create.mockResolvedValue({ id: 'token-1' });

    const response = await service.resend('test@example.com');

    expect(response).toEqual({ message: 'If the email exists, a verification link will be sent' });
    expect(response).not.toHaveProperty('token');
  });

  it('verifies with a valid token and returns no sensitive data', async () => {
    const futureDate = new Date(Date.now() + 86400000);
    const digest = 'test-digest';
    prisma.emailVerificationToken.findFirst.mockResolvedValue({
      id: 'token-1',
      userId: 'user-1',
      token: 'hashed-token',
      digest,
      expiresAt: futureDate,
    });
    prisma.user.update.mockResolvedValue({ id: 'user-1' });
    prisma.emailVerificationToken.update.mockResolvedValue({ id: 'token-1' });

    const response = await service.verify('raw-token');

    expect(response).toEqual({ verified: true });
    expect(response).not.toHaveProperty('token');
    expect(response).not.toHaveProperty('passwordHash');
  });
});
