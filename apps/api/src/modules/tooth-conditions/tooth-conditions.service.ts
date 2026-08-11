import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import { AuditService } from '../audit/audit.service';
import { CreateToothCondition, UpdateToothCondition } from '@danta/schemas';

@Injectable()
export class ToothConditionsService {
  constructor(private readonly prisma: PrismaService, private readonly auditService: AuditService) {}

  async findAll(tenantId: string, dentalChartId?: string) {
    const where: any = { tenantId };
    if (dentalChartId) where.dentalChartId = dentalChartId;
    return this.prisma.toothCondition.findMany({
      where,
      orderBy: { toothNumber: 'asc' },
    });
  }

  async findOne(tenantId: string, id: string) {
    const condition = await this.prisma.toothCondition.findFirst({
      where: { id, tenantId },
    });
    if (!condition) throw new NotFoundException('Tooth condition not found');
    return condition;
  }

  async create(tenantId: string, userId: string, data: CreateToothCondition) {
    const condition = await this.prisma.toothCondition.create({
      data: { tenantId, ...data },
    });

    await this.auditService.log({
      tenantId,
      userId,
      action: 'tooth_condition.create',
      resourceType: 'tooth_condition',
      resourceId: condition.id,
      result: 'success',
    });

    return condition;
  }

  async update(tenantId: string, userId: string, id: string, data: UpdateToothCondition) {
    const existing = await this.findOne(tenantId, id);
    const condition = await this.prisma.toothCondition.update({
      where: { id: existing.id },
      data,
    });

    await this.auditService.log({
      tenantId,
      userId,
      action: 'tooth_condition.update',
      resourceType: 'tooth_condition',
      resourceId: condition.id,
      result: 'success',
    });

    return condition;
  }

  async remove(tenantId: string, userId: string, id: string) {
    const existing = await this.findOne(tenantId, id);
    await this.prisma.toothCondition.delete({ where: { id: existing.id } });

    await this.auditService.log({
      tenantId,
      userId,
      action: 'tooth_condition.delete',
      resourceType: 'tooth_condition',
      resourceId: existing.id,
      result: 'success',
    });

    return { deleted: true };
  }
}
