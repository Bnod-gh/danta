import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import { AuditService } from '../audit/audit.service';
import { CreateRecall, UpdateRecall, RecallQuery } from '@danta/schemas';

@Injectable()
export class RecallsService {
  constructor(private readonly prisma: PrismaService, private readonly auditService: AuditService) {}

  async findAll(tenantId: string, query: RecallQuery, skip?: number, take?: number) {
    const where: any = { tenantId };
    if (query.patientId) where.patientId = query.patientId;
    if (query.type) where.type = query.type;
    if (query.status) where.status = query.status;
    if (query.overdue) {
      where.status = { in: ['due', 'overdue'] };
      where.dueDate = { lt: new Date() };
    }

    const [recalls, total] = await Promise.all([
      this.prisma.recall.findMany({
        where,
        skip: skip ?? 0,
        take: Math.min(take ?? 20, 100),
        orderBy: { dueDate: 'asc' },
      }),
      this.prisma.recall.count({ where }),
    ]);

    return { data: recalls, total, skip: skip ?? 0, take: take ?? 20 };
  }

  async findOne(tenantId: string, id: string) {
    const recall = await this.prisma.recall.findFirst({
      where: { id, tenantId },
    });
    if (!recall) throw new NotFoundException('Recall not found');
    return recall;
  }

  async create(tenantId: string, userId: string, data: CreateRecall) {
    const recall = await this.prisma.recall.create({
      data: { tenantId, ...data },
    });

    await this.auditService.log({
      tenantId,
      userId,
      action: 'recall.create',
      resourceType: 'recall',
      resourceId: recall.id,
      result: 'success',
    });

    return recall;
  }

  async update(tenantId: string, userId: string, id: string, data: UpdateRecall) {
    const existing = await this.findOne(tenantId, id);
    const recall = await this.prisma.recall.update({
      where: { id: existing.id },
      data,
    });

    await this.auditService.log({
      tenantId,
      userId,
      action: 'recall.update',
      resourceType: 'recall',
      resourceId: recall.id,
      result: 'success',
    });

    return recall;
  }
}
