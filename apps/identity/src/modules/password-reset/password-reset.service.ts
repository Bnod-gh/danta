import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import * as crypto from 'crypto';
import * as bcrypt from 'bcryptjs';

function tokenDigest(token: string) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

@Injectable()
export class PasswordResetService {
  constructor(private readonly prisma: PrismaService) {}

  async requestReset(email: string) {
    const user = await this.prisma.user.findFirst({ where: { email } });
    if (!user) {
      return { message: 'If the email exists, a reset link will be sent' };
    }

    const rawToken = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

    await this.prisma.passwordResetToken.create({
      data: {
        userId: user.id,
        token: tokenDigest(rawToken),
        digest: tokenDigest(rawToken),
        expiresAt,
      },
    });

    return { message: 'If the email exists, a reset link will be sent' };
  }

  async resetPassword(token: string, password: string) {
    const resetToken = await this.prisma.passwordResetToken.findFirst({
      where: { token: tokenDigest(token), usedAt: null },
    });

    if (!resetToken) {
      throw new BadRequestException('Invalid or expired token');
    }

    if (resetToken.expiresAt < new Date()) {
      throw new BadRequestException('Token expired');
    }

    const passwordHash = await bcrypt.hash(password, 12);

    await this.prisma.user.update({
      where: { id: resetToken.userId },
      data: { passwordHash },
    });

    await this.prisma.passwordResetToken.update({
      where: { id: resetToken.id },
      data: { usedAt: new Date() },
    });

    return { message: 'Password reset successful' };
  }
}
