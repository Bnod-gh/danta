import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import { AuditService } from '../audit/audit.service';

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

  async createSession(userId: string, refreshToken: string) {
    return this.prisma.userSession.create({
      data: {
        userId,
        refreshToken,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });
  }

  async findSessionByRefreshToken(refreshToken: string) {
    return this.prisma.userSession.findUnique({
      where: { refreshToken },
    });
  }

  async revokeSession(sessionId: string) {
    return this.prisma.userSession.update({
      where: { id: sessionId },
      data: { revokedAt: new Date() },
    });
  }
}
