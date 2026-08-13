import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Mock } from 'vitest';
import prisma from '@danta/database';
import { LoginAttemptCleanupService } from '../services/login-attempt-cleanup.service';

vi.mock('@danta/database', () => ({
  default: {
    loginAttempt: {
      deleteMany: vi.fn().mockResolvedValue({ count: 0 }),
    },
  },
}) as any);

describe('LoginAttemptCleanupService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should call deleteMany with correct cutoff and conditions', async () => {
    const mockDeleteMany = vi.fn().mockResolvedValue({ count: 3 });
    (prisma.loginAttempt.deleteMany as unknown as Mock) = mockDeleteMany;

    const service = new LoginAttemptCleanupService();
    const result = await service.cleanupExpiredLoginAttempts();

    expect(mockDeleteMany).toHaveBeenCalledTimes(1);
    const callArgs = mockDeleteMany.mock.calls[0][0];
    expect(callArgs.where).toBeDefined();
    expect(callArgs.where.OR).toHaveLength(2);
    expect(callArgs.where.lastAttemptAt).toBeDefined();
    expect(result.deletedCount).toBe(3);
  });

  it('should preserve records with future lockedUntil', async () => {
    const mockDeleteMany = vi.fn().mockResolvedValue({ count: 0 });
    (prisma.loginAttempt.deleteMany as unknown as Mock) = mockDeleteMany;

    const service = new LoginAttemptCleanupService();
    await service.cleanupExpiredLoginAttempts();

    const callArgs = mockDeleteMany.mock.calls[0][0];
    const nullLockCondition = callArgs.where.OR.find(
      (c: unknown) => typeof c === 'object' && c !== null && 'lockedUntil' in c && (c as { lockedUntil: unknown }).lockedUntil === null,
    );
    const pastLockCondition = callArgs.where.OR.find(
      (c: unknown) => typeof c === 'object' && c !== null && 'lockedUntil' in c && (c as { lockedUntil: { lt?: unknown } }).lockedUntil?.lt !== undefined,
    );

    expect(nullLockCondition).toBeDefined();
    expect(pastLockCondition).toBeDefined();
  });

  it('should be safe to run repeatedly', async () => {
    const mockDeleteMany = vi.fn().mockResolvedValue({ count: 0 });
    (prisma.loginAttempt.deleteMany as unknown as Mock) = mockDeleteMany;

    const service = new LoginAttemptCleanupService();
    await service.cleanupExpiredLoginAttempts();
    await service.cleanupExpiredLoginAttempts();

    expect(mockDeleteMany).toHaveBeenCalledTimes(2);
  });
});
