import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import { AuditService } from '../audit/audit.service';

@Injectable()
export class PatientMedicalHistoryService {
  constructor(private readonly prisma: PrismaService, private readonly auditService: AuditService) {}

  async findAll(tenantId: string, patientId: string) {
    return this.prisma.patientMedicalHistory.findMany({
      where: { tenantId, patientId },
    });
  }

  async create(tenantId: string, patientId: string, userId: string, data: any) {
    const record = await this.prisma.patientMedicalHistory.create({
      data: { tenantId, patientId, ...data },
    });

    await this.auditService.log({
      tenantId,
      userId,
      action: 'patient-medical-history.create',
      resourceType: 'patient-medical-history',
      resourceId: record.id,
      result: 'success',
    });

    return record;
  }

  async update(tenantId: string, patientId: string, userId: string, id: string, data: any) {
    const existing = await this.prisma.patientMedicalHistory.findFirst({ where: { id, patientId, tenantId } });
    if (!existing) throw new NotFoundException('Medical history record not found');

    const updated = await this.prisma.patientMedicalHistory.update({ where: { id }, data });

    await this.auditService.log({
      tenantId,
      userId,
      action: 'patient-medical-history.update',
      resourceType: 'patient-medical-history',
      resourceId: updated.id,
      result: 'success',
    });

    return updated;
  }

  async remove(tenantId: string, patientId: string, userId: string, id: string) {
    const existing = await this.prisma.patientMedicalHistory.findFirst({ where: { id, patientId, tenantId } });
    if (!existing) throw new NotFoundException('Medical history record not found');

    await this.prisma.patientMedicalHistory.delete({ where: { id } });

    await this.auditService.log({
      tenantId,
      userId,
      action: 'patient-medical-history.delete',
      resourceType: 'patient-medical-history',
      resourceId: existing.id,
      result: 'success',
    });

    return { deleted: true };
  }
}
