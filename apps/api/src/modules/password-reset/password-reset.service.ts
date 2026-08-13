import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import { AuditService } from '../audit/audit.service';
import * as crypto from 'crypto';
import bcrypt from 'bcryptjs';

@Injectable()
export class PasswordResetService {
  constructor(private readonly prisma: PrismaService, private readonly auditService: AuditService) {}

  async requestReset(email: string) {
    const user = await this.prisma.user.findFirst({ where: { email } });
    if (!user) return { message: 'If the email exists, a reset link will be sent' };

    const rawToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = await bcrypt.hash(rawToken, 12);
    const expiresAt = new Date(Date.now() + 3600000);

    await this.prisma.passwordResetToken.create({
      data: {
        userId: user.id,
        token: tokenHash,
        expiresAt,
      },
    });

    await this.auditService.log({
      tenantId: user.tenantId,
      userId: user.id,
      action: 'password_reset.requested',
      resourceType: 'user',
      resourceId: user.id,
      result: 'success',
    });

    return { message: 'If the email exists, a reset link will be sent', token: rawToken };
  }

  async resetPassword(token: string, password: string) {
    const tokens = await this.prisma.passwordResetToken.findMany({
      where: { usedAt: null, expiresAt: { gt: new Date() } },
    });

    let resetToken = null;
    for (const t of tokens) {
      if (await bcrypt.compare(token, t.token)) {
        resetToken = t;
        break;
      }
    }

    if (!resetToken) throw new BadRequestException('Invalid or expired token');

    const passwordHash = await bcrypt.hash(password, 12);

    const user = await this.prisma.user.update({
      where: { id: resetToken.userId },
      data: { passwordHash },
    });

    await this.prisma.userSession.updateMany({
      where: { userId: resetToken.userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });

    await this.prisma.passwordResetToken.update({
      where: { id: resetToken.id },
      data: { usedAt: new Date() },
    });

    await this.auditService.log({
      tenantId: user.tenantId,
      userId: user.id,
      action: 'password_reset.completed',
      resourceType: 'user',
      resourceId: user.id,
      result: 'success',
    });

    return { message: 'Password reset successfully' };
  }
}
