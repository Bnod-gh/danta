import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';

@Injectable()
export class AuditService {
  constructor(private readonly prisma: PrismaService) {}

  async log(data: {
    tenantId?: string;
    userId?: string;
    action: string;
    resourceType?: string;
    resourceId?: string;
    ipAddress?: string;
    userAgent?: string;
    correlationId?: string;
    result?: string;
    metadata?: any;
  }) {
    return this.prisma.auditLog.create({
      data: {
        tenantId: data.tenantId === 'unknown' ? undefined : data.tenantId,
        userId: data.userId,
        action: data.action,
        resourceType: data.resourceType,
        resourceId: data.resourceId,
        ipAddress: data.ipAddress,
        userAgent: data.userAgent,
        correlationId: data.correlationId,
        result: data.result ?? 'success',
        metadata: data.metadata,
      },
    });
  }
  async search(query: { tenantId?: string; action?: string; userId?: string; resourceType?: string; skip?: number; take?: number }) {
    const where: any = { tenantId: query.tenantId };
    if (query.action) where.action = query.action;
    if (query.userId) where.userId = query.userId;
    if (query.resourceType) where.resourceType = query.resourceType;
    return this.prisma.auditLog.findMany({ where, skip: query.skip, take: query.take, orderBy: { createdAt: 'desc' } });
  }

  async stats(query: { tenantId?: string; startDate?: Date; endDate?: Date }) {
    const where: any = { tenantId: query.tenantId };
    if (query.startDate && query.endDate) where.createdAt = { gte: query.startDate, lte: query.endDate };
    const total = await this.prisma.auditLog.count({ where });
    return { total };
  }

}
