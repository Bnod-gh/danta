import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import { AuditService } from '../audit/audit.service';
import { CreatePeriodontalRecord, UpdatePeriodontalRecord } from '@danta/schemas';

@Injectable()
export class PeriodontalRecordsService {
  constructor(private readonly prisma: PrismaService, private readonly auditService: AuditService) {}

  async findAll(tenantId: string, patientId?: string) {
    const where: any = { tenantId };
    if (patientId) where.patientId = patientId;
    return this.prisma.periodontalRecord.findMany({
      where,
      include: {
        patient: { select: { id: true, firstName: true, lastName: true } },
        provider: { select: { id: true, firstName: true, lastName: true } },
      },
      orderBy: { chartDate: 'desc' },
    });
  }

  async findOne(tenantId: string, id: string) {
    const record = await this.prisma.periodontalRecord.findFirst({
      where: { id, tenantId },
      include: {
        patient: { select: { id: true, firstName: true, lastName: true } },
        provider: { select: { id: true, firstName: true, lastName: true } },
      },
    });
    if (!record) throw new NotFoundException('Periodontal record not found');
    return record;
  }

  async create(tenantId: string, userId: string, data: CreatePeriodontalRecord) {
    const record = await this.prisma.periodontalRecord.create({
      data: { tenantId, ...data },
      include: {
        patient: { select: { id: true, firstName: true, lastName: true } },
        provider: { select: { id: true, firstName: true, lastName: true } },
      },
    });

    await this.auditService.log({
      tenantId,
      userId,
      action: 'periodontal_record.create',
      resourceType: 'periodontal_record',
      resourceId: record.id,
      result: 'success',
    });

    return record;
  }

  async update(tenantId: string, userId: string, id: string, data: UpdatePeriodontalRecord) {
    const existing = await this.findOne(tenantId, id);
    const record = await this.prisma.periodontalRecord.update({
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
      action: 'periodontal_record.update',
      resourceType: 'periodontal_record',
      resourceId: record.id,
      result: 'success',
    });

    return record;
  }

  async remove(tenantId: string, userId: string, id: string) {
    const existing = await this.findOne(tenantId, id);
    await this.prisma.periodontalRecord.delete({ where: { id: existing.id } });

    await this.auditService.log({
      tenantId,
      userId,
      action: 'periodontal_record.delete',
      resourceType: 'periodontal_record',
      resourceId: existing.id,
      result: 'success',
    });

    return { deleted: true };
  }
}
