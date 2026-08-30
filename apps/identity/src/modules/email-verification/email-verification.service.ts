import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import * as crypto from 'crypto';

function tokenDigest(token: string) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

@Injectable()
export class EmailVerificationService {
  constructor(private readonly prisma: PrismaService) {}

  async verify(token: string) {
    const verification = await this.prisma.emailVerificationToken.findFirst({
      where: { token: tokenDigest(token), usedAt: null },
    });

    if (!verification) {
      throw new BadRequestException('Invalid or expired token');
    }

    if (verification.expiresAt && verification.expiresAt < new Date()) {
      throw new BadRequestException('Token expired');
    }

    await this.prisma.emailVerificationToken.update({
      where: { id: verification.id },
      data: { usedAt: new Date() },
    });

    return { message: 'Email verified successfully' };
  }

  async resend(email: string) {
    const user = await this.prisma.user.findFirst({ where: { email } });
    if (!user) {
      return { message: 'If the email exists, a verification link will be sent' };
    }

    const rawToken = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

    await this.prisma.emailVerificationToken.create({
      data: {
        userId: user.id,
        token: tokenDigest(rawToken),
        digest: tokenDigest(rawToken),
        expiresAt,
      },
    });

    return { message: 'If the email exists, a verification link will be sent' };
  }
}
