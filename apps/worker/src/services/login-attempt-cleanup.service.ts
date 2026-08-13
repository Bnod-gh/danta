import { Injectable, Logger } from '@nestjs/common';
import prisma from '@danta/database';

@Injectable()
export class LoginAttemptCleanupService {
  private readonly logger = new Logger(LoginAttemptCleanupService.name);
  private readonly retentionDays = 30;

  constructor() {}

  async cleanupExpiredLoginAttempts(): Promise<{ deletedCount: number }> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - this.retentionDays);

    const result = await prisma.loginAttempt.deleteMany({
      where: {
        OR: [
          { lockedUntil: null },
          { lockedUntil: { lt: new Date() } },
        ],
        lastAttemptAt: { lt: cutoffDate },
      },
    });

    this.logger.log(`Cleaned up ${result.count} expired login attempt(s)`);
    return { deletedCount: result.count };
  }
}
