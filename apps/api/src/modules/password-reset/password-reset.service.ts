import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import { AuditService } from '../audit/audit.service';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';
import bcrypt from 'bcryptjs';

@Injectable()
export class PasswordResetService {
  constructor(private readonly prisma: PrismaService, private readonly auditService: AuditService, private readonly configService: ConfigService) {}

  private getDigestSecret(): string {
    return this.configService.get<string>('JWT_SECRET') || 'default-secret';
  }

  private computeDigest(rawToken: string): string {
    return crypto.createHmac('sha256', this.getDigestSecret()).update(rawToken).digest('hex');
  }

  async requestReset(email: string) {
    const user = await this.prisma.user.findFirst({ where: { email } });
    if (!user) return { message: 'If the email exists, a reset link will be sent' };

    const rawToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = await bcrypt.hash(rawToken, 12);
    const digest = this.computeDigest(rawToken);
    const expiresAt = new Date(Date.now() + 3600000);

    await this.prisma.passwordResetToken.create({
      data: {
        userId: user.id,
        token: tokenHash,
        digest,
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

    return { message: 'If the email exists, a reset link will be sent' };
  }

  async resetPassword(token: string, password: string) {
    const digest = this.computeDigest(token);
    const tokenRecord = await this.prisma.passwordResetToken.findFirst({
      where: { digest, usedAt: null, expiresAt: { gt: new Date() } },
    });

    if (!tokenRecord || !await bcrypt.compare(token, tokenRecord.token)) {
      throw new BadRequestException('Invalid or expired token');
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const user = await this.prisma.user.update({
      where: { id: tokenRecord.userId },
      data: { passwordHash },
    });

    await this.prisma.userSession.updateMany({
      where: { userId: tokenRecord.userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });

    await this.prisma.passwordResetToken.update({
      where: { id: tokenRecord.id },
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
