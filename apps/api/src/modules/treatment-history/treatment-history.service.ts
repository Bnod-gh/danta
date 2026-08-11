import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import { AuditService } from '../audit/audit.service';
import { CreateTreatmentHistory, UpdateTreatmentHistory } from '@danta/schemas';

@Injectable()
export class TreatmentHistoryService {
  constructor(private readonly prisma: PrismaService, private readonly auditService: AuditService) {}

  async findAll(tenantId: string, patientId?: string) {
    const where: any = { tenantId };
    if (patientId) where.patientId = patientId;
    return this.prisma.treatmentHistory.findMany({
      where,
      include: {
        patient: { select: { id: true, firstName: true, lastName: true } },
        provider: { select: { id: true, firstName: true, lastName: true } },
      },
      orderBy: { date: 'desc' },
    });
  }

  async findOne(tenantId: string, id: string) {
    const record = await this.prisma.treatmentHistory.findFirst({
      where: { id, tenantId },
      include: {
        patient: { select: { id: true, firstName: true, lastName: true } },
        provider: { select: { id: true, firstName: true, lastName: true } },
      },
    });
    if (!record) throw new NotFoundException('Treatment history not found');
    return record;
  }

  async create(tenantId: string, userId: string, data: CreateTreatmentHistory) {
    const record = await this.prisma.treatmentHistory.create({
      data: { tenantId, ...data },
      include: {
        patient: { select: { id: true, firstName: true, lastName: true } },
        provider: { select: { id: true, firstName: true, lastName: true } },
      },
    });

    await this.auditService.log({
      tenantId,
      userId,
      action: 'treatment_history.create',
      resourceType: 'treatment_history',
      resourceId: record.id,
      result: 'success',
    });

    return record;
  }

  async update(tenantId: string, userId: string, id: string, data: UpdateTreatmentHistory) {
    const existing = await this.findOne(tenantId, id);
    const record = await this.prisma.treatmentHistory.update({
      where: { id: existing.id },
      data,
      include: {
        patient: { select: { id: true, firstName: true, lastName: true } },
        provider: { select: { id: true, firstName: true, lastName: true } },
      },
    });

    await this.auditService.log({
      tenantId,
      userId,
      action: 'treatment_history.update',
      resourceType: 'treatment_history',
      resourceId: record.id,
      result: 'success',
    });

    return record;
  }

  async remove(tenantId: string, userId: string, id: string) {
    const existing = await this.findOne(tenantId, id);
    await this.prisma.treatmentHistory.delete({ where: { id: existing.id } });

    await this.auditService.log({
      tenantId,
      userId,
      action: 'treatment_history.delete',
      resourceType: 'treatment_history',
      resourceId: existing.id,
      result: 'success',
    });

    return { deleted: true };
  }
}
