import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';

@Injectable()
export class AuditSearchService {
  constructor(private readonly prisma: PrismaService) {}

  async advancedSearch(filters: {
    tenantId: string;
    userId?: string;
    action?: string;
    resourceType?: string;
    resourceId?: string;
    result?: string;
    patientId?: string;
    startDate?: Date;
    endDate?: Date;
    search?: string;
    skip?: number;
    take?: number;
  }) {
    const where: any = { tenantId: filters.tenantId };

    if (filters.userId) where.userId = filters.userId;
    if (filters.action) where.action = { contains: filters.action, mode: 'insensitive' };
    if (filters.resourceType) where.resourceType = filters.resourceType;
    if (filters.resourceId) where.resourceId = filters.resourceId;
    if (filters.result) where.result = filters.result;
    if (filters.patientId) where.resourceId = filters.patientId;
    if (filters.startDate || filters.endDate) {
      where.createdAt = {};
      if (filters.startDate) where.createdAt.gte = filters.startDate;
      if (filters.endDate) where.createdAt.lte = filters.endDate;
    }
    if (filters.search) {
      where.OR = [
        { action: { contains: filters.search, mode: 'insensitive' } },
        { resourceType: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    const [logs, total] = await Promise.all([
      this.prisma.auditLog.findMany({
        where,
        skip: filters.skip ?? 0,
        take: Math.min(filters.take ?? 20, 100),
        orderBy: { createdAt: 'desc' },
        include: { user: { select: { id: true, email: true, firstName: true, lastName: true } } },
      }),
      this.prisma.auditLog.count({ where }),
    ]);

    return { data: logs, total, skip: filters.skip ?? 0, take: filters.take ?? 20 };
  }

  async exportAuditLogs(tenantId: string, startDate: Date, endDate: Date, format: 'csv' | 'json') {
    const where = { tenantId, createdAt: { gte: startDate, lte: endDate } };
    const logs = await this.prisma.auditLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: { user: { select: { id: true, email: true, firstName: true, lastName: true } } },
    });

    if (format === 'json') {
      return JSON.stringify(logs, null, 2);
    }

    const headers = ['ID', 'User ID', 'User Email', 'Action', 'Resource Type', 'Resource ID', 'Result', 'IP Address', 'User Agent', 'Metadata', 'Created At'];
    const rows = logs.map(log => [
      log.id,
      log.userId || '',
      log.user?.email || '',
      log.action,
      log.resourceType || '',
      log.resourceId || '',
      log.result,
      log.ipAddress || '',
      log.userAgent || '',
      JSON.stringify(log.metadata || {}),
      log.createdAt.toISOString(),
    ]);

    const escape = (value: string): string => {
      if (value.includes(',') || value.includes('"') || value.includes('\n')) {
        return `"${value.replace(/"/g, '""')}"`;
      }
      return value;
    };

    const headerRow = headers.map(escape).join(',');
    const dataRows = rows.map(row => row.map(escape).join(','));
    return [headerRow, ...dataRows].join('\n');
  }
}
