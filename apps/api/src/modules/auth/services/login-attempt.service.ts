import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma.service';

const LOCK_THRESHOLD = 5;
const BASE_LOCK_MS = 60_000; // 1 minute
const MAX_LOCK_MS = 3_600_000; // 1 hour

@Injectable()
export class LoginAttemptService {
  constructor(private readonly prisma: PrismaService) {}

  async recordAttempt(email: string, success: boolean) {
    const key = `login:${email.toLowerCase()}`;
    const now = new Date();

    if (success) {
      // Clear the record on successful login
      await this.prisma.loginAttempt.upsert({
        where: { email: key },
        create: { email: key, attempts: 0, lastAttemptAt: now },
        update: { attempts: 0, lockedUntil: null, lastAttemptAt: now },
      });
      return;
    }

    // Increment attempt counter (no lock yet)
    const attempt = await this.prisma.loginAttempt.upsert({
      where: { email: key },
      create: { email: key, attempts: 1, lastAttemptAt: now },
      update: { attempts: { increment: 1 }, lastAttemptAt: now },
    });

    // Apply exponential lock only once the threshold is reached
    if (attempt.attempts >= LOCK_THRESHOLD) {
      const lockDuration = Math.min(
        BASE_LOCK_MS * Math.pow(2, attempt.attempts - LOCK_THRESHOLD),
        MAX_LOCK_MS,
      );
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

    // Lock has expired — reset
    await this.prisma.loginAttempt.update({
      where: { email: `login:${email.toLowerCase()}` },
      data: { attempts: 0, lockedUntil: null },
    });

    return false;
  }
}
