import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma.service';

@Injectable()
export class LoginAttemptService {
  constructor(private readonly prisma: PrismaService) {}

  async recordAttempt(email: string, success: boolean) {
    const key = `login:${email.toLowerCase()}`;
    const now = new Date();

    const attempt = await this.prisma.loginAttempt.upsert({
      where: { email },
      create: {
        email: key,
        attempts: 1,
        lockedUntil: success ? null : new Date(now.getTime() + 60000),
        lastAttemptAt: now,
      },
      update: success
        ? { attempts: 0, lockedUntil: null, lastAttemptAt: now }
        : { attempts: { increment: 1 }, lastAttemptAt: now, lockedUntil: new Date(now.getTime() + 60000) },
    });

    if (!success && attempt.attempts >= 5) {
      const lockDuration = Math.min(60000 * Math.pow(2, attempt.attempts - 5), 3600000);
      await this.prisma.loginAttempt.update({
        where: { email: key },
        data: { lockedUntil: new Date(now.getTime() + lockDuration) },
      });
    }
  }

  async isLocked(email: string): Promise<boolean> {
    const attempt = await this.prisma.loginAttempt.findUnique({
      where: { email: `login:${email.toLowerCase()}` },
    });

    if (!attempt || !attempt.lockedUntil) {
      return false;
    }

    if (attempt.lockedUntil > new Date()) {
      return true;
    }

    await this.prisma.loginAttempt.update({
      where: { email: `login:${email.toLowerCase()}` },
      data: { attempts: 0, lockedUntil: null },
    });

    return false;
  }
}
