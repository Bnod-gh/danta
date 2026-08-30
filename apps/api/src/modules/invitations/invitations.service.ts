import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import { AuditService } from '../audit/audit.service';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';
import bcrypt from 'bcryptjs';
import type { UserRole } from '@prisma/client';

@Injectable()
export class InvitationsService {
  constructor(private readonly prisma: PrismaService, private readonly auditService: AuditService, private readonly configService: ConfigService) {}

  private getDigestSecret(): string {
    return this.configService.get<string>('JWT_SECRET') || 'default-secret';
  }

  private computeDigest(rawToken: string): string {
    return crypto.createHmac('sha256', this.getDigestSecret()).update(rawToken).digest('hex');
  }

  async create(data: { tenantId: string; email: string; role: UserRole }) {
    const rawToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = await bcrypt.hash(rawToken, 12);
    const digest = this.computeDigest(rawToken);
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    const invitation = await this.prisma.invitation.create({
      data: {
        tenantId: data.tenantId,
        email: data.email,
        role: data.role,
        token: tokenHash,
        digest,
        expiresAt,
      },
    });

    await this.auditService.log({
      tenantId: data.tenantId,
      action: 'invitation.created',
      resourceType: 'invitation',
      resourceId: invitation.id,
      result: 'success',
      metadata: { email: invitation.email, role: invitation.role },
    });

    return { invitation, token: rawToken };
  }

  async accept(token: string, data: { password: string; firstName: string; lastName: string }) {
    const digest = this.computeDigest(token);
    const invitations = await this.prisma.invitation.findMany({
      where: { digest, acceptedAt: null, expiresAt: { gt: new Date() } },
    });

    let invitation = null;
    for (const inv of invitations) {
      if (await bcrypt.compare(token, inv.token)) {
        invitation = inv;
        break;
      }
    }

    if (!invitation) throw new BadRequestException('Invalid or expired invitation');

    const passwordHash = await bcrypt.hash(data.password, 12);

    const user = await this.prisma.user.create({
      data: {
        tenantId: invitation.tenantId,
        email: invitation.email,
        passwordHash,
        firstName: data.firstName,
        lastName: data.lastName,
        role: invitation.role,
        status: 'active',
      },
    });

    await this.prisma.invitation.update({
      where: { id: invitation.id },
      data: { acceptedAt: new Date() },
    });

    await this.auditService.log({
      tenantId: invitation.tenantId,
      userId: user.id,
      action: 'invitation.accepted',
      resourceType: 'invitation',
      resourceId: invitation.id,
      result: 'success',
      metadata: { email: user.email, role: user.role },
    });

    return { id: user.id, email: user.email, firstName: user.firstName, lastName: user.lastName, role: user.role };
  }
}
