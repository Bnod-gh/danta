import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import { AuditService } from '../audit/audit.service';
import { CreateFeeSchedule, UpdateFeeSchedule } from '@danta/schemas';

@Injectable()
export class FeesService {
  constructor(private readonly prisma: PrismaService, private readonly auditService: AuditService) {}

  async findAll(tenantId: string, serviceId?: string) {
    const where: any = { tenantId };
    if (serviceId) where.serviceId = serviceId;
    return this.prisma.feeSchedule.findMany({
      where,
      include: { service: true },
      orderBy: { effectiveFrom: 'desc' },
    });
  }

  async findOne(tenantId: string, id: string) {
    const fee = await this.prisma.feeSchedule.findFirst({
      where: { id, tenantId },
      include: { service: true },
    });
    if (!fee) throw new NotFoundException('Fee schedule not found');
    return fee;
  }

  async create(tenantId: string, userId: string, data: CreateFeeSchedule) {
    const fee = await this.prisma.feeSchedule.create({
      data: { tenantId, ...data },
      include: { service: true },
    });

    await this.auditService.log({
      tenantId,
      userId,
      action: 'fee_schedule.create',
      resourceType: 'fee_schedule',
      resourceId: fee.id,
      result: 'success',
    });

    return fee;
  }

  async update(tenantId: string, userId: string, id: string, data: UpdateFeeSchedule) {
    const existing = await this.findOne(tenantId, id);
    const fee = await this.prisma.feeSchedule.update({
      where: { id: existing.id },
      data,
      include: { service: true },
    });

    await this.auditService.log({
      tenantId,
      userId,
      action: 'fee_schedule.update',
      resourceType: 'fee_schedule',
      resourceId: fee.id,
      result: 'success',
    });

    return fee;
  }

  async remove(tenantId: string, userId: string, id: string) {
    const existing = await this.findOne(tenantId, id);
    await this.prisma.feeSchedule.delete({ where: { id: existing.id } });

    await this.auditService.log({
      tenantId,
      userId,
      action: 'fee_schedule.delete',
      resourceType: 'fee_schedule',
      resourceId: existing.id,
      result: 'success',
    });

    return { deleted: true };
  }
}
