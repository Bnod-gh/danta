import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import { AuditService } from '../audit/audit.service';

@Injectable()
export class PatientMedicationsService {
  constructor(private readonly prisma: PrismaService, private readonly auditService: AuditService) {}

  async findAll(tenantId: string, patientId: string) {
    return this.prisma.patientMedication.findMany({
      where: { tenantId, patientId },
    });
  }

  async create(tenantId: string, patientId: string, userId: string, data: any) {
    const medication = await this.prisma.patientMedication.create({
      data: { tenantId, patientId, ...data },
    });

    await this.auditService.log({
      tenantId,
      userId,
      action: 'patient-medication.create',
      resourceType: 'patient-medication',
      resourceId: medication.id,
      result: 'success',
    });

    return medication;
  }

  async update(tenantId: string, patientId: string, userId: string, id: string, data: any) {
    const existing = await this.prisma.patientMedication.findFirst({ where: { id, patientId, tenantId } });
    if (!existing) throw new NotFoundException('Medication not found');

    const updated = await this.prisma.patientMedication.update({ where: { id }, data });

    await this.auditService.log({
      tenantId,
      userId,
      action: 'patient-medication.update',
      resourceType: 'patient-medication',
      resourceId: updated.id,
      result: 'success',
    });

    return updated;
  }

  async remove(tenantId: string, patientId: string, userId: string, id: string) {
    const existing = await this.prisma.patientMedication.findFirst({ where: { id, patientId, tenantId } });
    if (!existing) throw new NotFoundException('Medication not found');

    await this.prisma.patientMedication.delete({ where: { id } });

    await this.auditService.log({
      tenantId,
      userId,
      action: 'patient-medication.delete',
      resourceType: 'patient-medication',
      resourceId: existing.id,
      result: 'success',
    });

    return { deleted: true };
  }
}
