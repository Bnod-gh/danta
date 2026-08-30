import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';

@Injectable()
export class LoginAttemptService {
  constructor(private readonly prisma: PrismaService) {}

  async isLocked(email: string): Promise<boolean> {
    const attempt = await this.prisma.loginAttempt.findFirst({
      where: { email },
      orderBy: { lastAttemptAt: 'desc' },
    });

    if (!attempt || !attempt.lockedUntil) {
      return false;
    }

    if (attempt.lockedUntil > new Date()) {
      return true;
    }

    return false;
  }

  async recordAttempt(email: string, success: boolean) {
    const existing = await this.prisma.loginAttempt.findFirst({
      where: { email },
      orderBy: { lastAttemptAt: 'desc' },
    });

    const now = new Date();

    if (success) {
      if (existing) {
        await this.prisma.loginAttempt.update({
          where: { email },
          data: { attempts: 0, lockedUntil: null, lastAttemptAt: now },
        });
      }
      return;
    }

    const failedAttempts = existing ? existing.attempts + 1 : 1;
    let lockedUntil: Date | null = null;

    if (failedAttempts >= 5) {
      const delayMinutes = Math.min(Math.pow(2, failedAttempts - 5), 60);
      lockedUntil = new Date(now.getTime() + delayMinutes * 60 * 1000);
    }

    if (existing) {
      await this.prisma.loginAttempt.update({
        where: { email },
        data: { attempts: failedAttempts, lockedUntil, lastAttemptAt: now },
      });
    } else {
      await this.prisma.loginAttempt.create({
        data: {
          email,
          attempts: failedAttempts,
          lockedUntil,
          lastAttemptAt: now,
        },
      });
    }

    if (lockedUntil) {
      throw new BadRequestException(`Account temporarily locked. Try again after ${lockedUntil.toISOString()}`);
    }
  }
}
