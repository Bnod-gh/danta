import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import { AuditService } from '../audit/audit.service';
import { createHash } from 'node:crypto';

/** Returns the SHA-256 hex digest of a refresh token for safe DB storage. */
function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService, private readonly auditService: AuditService) {}

  async findById(tenantId?: string, id?: string) {
    const where: any = {};
    if (id) where.id = id;
    if (tenantId) where.tenantId = tenantId;

    const user = await this.prisma.user.findFirst({ where });
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async findByEmail(email: string) {
    return this.prisma.user.findFirst({
      where: { email },
    });
  }

  async create(data: { email: string; passwordHash: string; firstName: string; lastName: string; tenantId: string; role: string; organisationId?: string; practiceId?: string; locationId?: string }, userId?: string) {
    const user = await this.prisma.user.create({
      data: {
        email: data.email,
        passwordHash: data.passwordHash,
        firstName: data.firstName,
        lastName: data.lastName,
        tenantId: data.tenantId,
        role: data.role as any,
        organisationId: data.organisationId,
        practiceId: data.practiceId,
        locationId: data.locationId,
      },
    });

    await this.auditService.log({
      tenantId: data.tenantId,
      userId,
      action: 'user.create',
      resourceType: 'user',
      resourceId: user.id,
      result: 'success',
      metadata: { email: user.email, role: user.role },
    });

    return user;
  }

  async createSession(userId: string, rawRefreshToken: string) {
    return this.prisma.userSession.create({
      data: {
        userId,
        // Store only the hash — the raw token is only ever in memory/cookies
        refreshToken: hashToken(rawRefreshToken),
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });
  }

  async findSessionByRefreshToken(rawRefreshToken: string) {
    return this.prisma.userSession.findUnique({
      where: { refreshToken: hashToken(rawRefreshToken) },
    });
  }

  async revokeSession(sessionId: string) {
    return this.prisma.userSession.update({
      where: { id: sessionId },
      data: { revokedAt: new Date() },
    });
  }
}
