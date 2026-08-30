import { InvitationsService } from './invitations.service';

jest.mock('bcryptjs', () => ({
  compare: jest.fn().mockResolvedValue(true),
  hash: jest.fn().mockResolvedValue('hashed'),
}));

describe('InvitationsService', () => {
  const prisma = {
    invitation: { create: jest.fn(), findMany: jest.fn(), update: jest.fn() },
    user: { create: jest.fn() },
  };
  const auditService = { log: jest.fn().mockResolvedValue(undefined) };
  const configService = { get: jest.fn().mockReturnValue('test-secret') };

  let service: InvitationsService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new InvitationsService(prisma as any, auditService as any, configService as any);
  });

  it('does not expose passwordHash in invitation acceptance response', async () => {
    const futureDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    prisma.invitation.findMany.mockResolvedValue([
      {
        id: 'inv-1',
        tenantId: 'tenant-1',
        email: 'test@example.com',
        role: 'receptionist',
        token: 'hashed-token',
        expiresAt: futureDate,
        acceptedAt: null,
      },
    ]);
    prisma.user.create.mockResolvedValue({
      id: 'user-1',
      email: 'test@example.com',
      firstName: 'Test',
      lastName: 'User',
      role: 'receptionist',
      passwordHash: 'bcrypt-hash',
    });
    prisma.invitation.update.mockResolvedValue({ id: 'inv-1', acceptedAt: new Date() });

    const response = await service.accept('raw-token', {
      password: 'SecurePass1!',
      firstName: 'Test',
      lastName: 'User',
    });

    expect(response).toEqual({
      id: 'user-1',
      email: 'test@example.com',
      firstName: 'Test',
      lastName: 'User',
      role: 'receptionist',
    });
    expect(response).not.toHaveProperty('passwordHash');
  });
});
