import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import * as bcrypt from 'bcryptjs';
import * as crypto from 'crypto';

function tokenDigest(token: string) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

@Injectable()
export class InvitationsService {
  constructor(private readonly prisma: PrismaService) {}

  async accept(token: string, data: { password: string; firstName: string; lastName: string }) {
    const invitation = await this.prisma.invitation.findFirst({
      where: { token: tokenDigest(token), acceptedAt: null },
    });

    if (!invitation) {
      throw new NotFoundException('Invalid invitation');
    }

    if (invitation.expiresAt && invitation.expiresAt < new Date()) {
      throw new BadRequestException('Invitation expired');
    }

    const passwordHash = await bcrypt.hash(data.password, 12);

    const user = await this.prisma.user.create({
      data: {
        email: invitation.email,
        passwordHash,
        firstName: data.firstName,
        lastName: data.lastName,
        tenantId: invitation.tenantId,
        role: invitation.role,
      },
    });

    await this.prisma.invitation.update({
      where: { id: invitation.id },
      data: { acceptedAt: new Date() },
    });

    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      tenantId: user.tenantId,
      status: user.status,
    };
  }
}
