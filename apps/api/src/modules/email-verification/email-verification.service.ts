import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import { AuditService } from '../audit/audit.service';
import * as crypto from 'crypto';
import bcrypt from 'bcryptjs';

@Injectable()
export class EmailVerificationService {
  constructor(private readonly prisma: PrismaService, private readonly auditService: AuditService) {}

  async verify(token: string) {
    const tokens = await this.prisma.emailVerificationToken.findMany({
      where: { usedAt: null, expiresAt: { gt: new Date() } },
    });

    let verificationToken = null;
    for (const t of tokens) {
      if (await bcrypt.compare(token, t.token)) {
        verificationToken = t;
        break;
      }
    }

    if (!verificationToken) throw new BadRequestException('Invalid token');

    const user = await this.prisma.user.update({
      where: { id: verificationToken.userId },
      data: { status: 'active' },
    });

    await this.prisma.emailVerificationToken.update({
      where: { id: verificationToken.id },
      data: { usedAt: new Date() },
    });

    await this.auditService.log({
      tenantId: user.tenantId,
      userId: user.id,
      action: 'email_verification.verified',
      resourceType: 'user',
      resourceId: user.id,
      result: 'success',
    });

    return { verified: true };
  }

  async resend(email: string) {
    const user = await this.prisma.user.findFirst({ where: { email } });
    if (!user) return { message: 'If the email exists, a verification link will be sent' };

    const rawToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = await bcrypt.hash(rawToken, 12);
    const expiresAt = new Date(Date.now() + 86400000);

    await this.prisma.emailVerificationToken.create({
      data: {
        userId: user.id,
        token: tokenHash,
        expiresAt,
      },
    });

    await this.auditService.log({
      tenantId: user.tenantId,
      userId: user.id,
      action: 'email_verification.resent',
      resourceType: 'user',
      resourceId: user.id,
      result: 'success',
    });

    return { message: 'If the email exists, a verification link will be sent', token: rawToken };
  }
}
