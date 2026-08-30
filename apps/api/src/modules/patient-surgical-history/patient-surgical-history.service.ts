import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import { AuditService } from '../audit/audit.service';
import { CreatePatientSurgicalHistory, UpdatePatientSurgicalHistory } from '@danta/schemas';

@Injectable()
export class PatientSurgicalHistoryService {
  constructor(private readonly prisma: PrismaService, private readonly auditService: AuditService) {}

  async findAll(tenantId: string, patientId: string) {
    return this.prisma.patient_surgical_history.findMany({
      where: { tenantId, patientId },
      orderBy: { surgeryDate: 'desc' },
    });
  }

  async create(tenantId: string, patientId: string, userId: string, data: CreatePatientSurgicalHistory) {
    const record = await this.prisma.patient_surgical_history.create({
      data: { tenantId, patientId, ...data },
    });

    await this.auditService.log({
      tenantId,
      userId,
      action: 'patient-surgical-history.create',
      resourceType: 'patient-surgical-history',
      resourceId: record.id,
      result: 'success',
    });

    return record;
  }

  async update(tenantId: string, patientId: string, userId: string, id: string, data: UpdatePatientSurgicalHistory) {
    const existing = await this.prisma.patient_surgical_history.findFirst({ where: { id, patientId, tenantId } });
    if (!existing) throw new NotFoundException('Surgical history record not found');

    const updated = await this.prisma.patient_surgical_history.update({ where: { id }, data });

    await this.auditService.log({
      tenantId,
      userId,
      action: 'patient-surgical-history.update',
      resourceType: 'patient-surgical-history',
      resourceId: updated.id,
      result: 'success',
    });

    return updated;
  }

  async remove(tenantId: string, patientId: string, userId: string, id: string) {
    const existing = await this.prisma.patient_surgical_history.findFirst({ where: { id, patientId, tenantId } });
    if (!existing) throw new NotFoundException('Surgical history record not found');

    await this.prisma.patient_surgical_history.delete({ where: { id } });

    await this.auditService.log({
      tenantId,
      userId,
      action: 'patient-surgical-history.delete',
      resourceType: 'patient-surgical-history',
      resourceId: existing.id,
      result: 'success',
    });

    return { deleted: true };
  }
}
