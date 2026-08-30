import { PasswordResetService } from './password-reset.service';

jest.mock('bcryptjs', () => ({
  compare: jest.fn().mockResolvedValue(true),
  hash: jest.fn().mockResolvedValue('hashed'),
}));

describe('PasswordResetService', () => {
  const prisma = {
    user: { findFirst: jest.fn(), update: jest.fn() },
    passwordResetToken: { create: jest.fn(), findFirst: jest.fn(), update: jest.fn() },
    userSession: { updateMany: jest.fn() },
  };
  const auditService = { log: jest.fn().mockResolvedValue(undefined) };
  const configService = { get: jest.fn().mockReturnValue('test-secret') };

  let service: PasswordResetService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new PasswordResetService(prisma as any, auditService as any, configService as any);
  });

  it('does not return the raw token in the response', async () => {
    prisma.user.findFirst.mockResolvedValue({ id: 'user-1', tenantId: 'tenant-1' });
    prisma.passwordResetToken.create.mockResolvedValue({ id: 'token-1' });

    const response = await service.requestReset('test@example.com');

    expect(response).toEqual({ message: 'If the email exists, a reset link will be sent' });
    expect(response).not.toHaveProperty('token');
  });

  it('resets password with a valid token and returns no sensitive data', async () => {
    const futureDate = new Date(Date.now() + 3600000);
    prisma.passwordResetToken.findFirst.mockResolvedValue({
      id: 'token-1',
      userId: 'user-1',
      token: 'hashed-token',
      expiresAt: futureDate,
    });
    prisma.user.update.mockResolvedValue({ id: 'user-1' });
    prisma.passwordResetToken.update.mockResolvedValue({ id: 'token-1' });
    prisma.userSession.updateMany.mockResolvedValue({});

    const response = await service.resetPassword('raw-token', 'new-password');

    expect(response).toEqual({ message: 'Password reset successfully' });
    expect(response).not.toHaveProperty('token');
    expect(response).not.toHaveProperty('passwordHash');
  });
});
