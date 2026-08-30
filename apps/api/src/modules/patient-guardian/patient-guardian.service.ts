import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import { AuditService } from '../audit/audit.service';
import { UpsertPatientGuardian } from '@danta/schemas';

@Injectable()
export class PatientGuardianService {
  constructor(private readonly prisma: PrismaService, private readonly auditService: AuditService) {}

  async findOne(tenantId: string, patientId: string) {
    return this.prisma.patient_legal_guardians.findFirst({
      where: { tenantId, patientId },
    });
  }

  async upsert(tenantId: string, userId: string, patientId: string, data: UpsertPatientGuardian) {
    const patient = await this.prisma.patient.findFirst({ where: { id: patientId, tenantId } });
    if (!patient) throw new NotFoundException('Patient not found');

    const existing = await this.findOne(tenantId, patientId);

    const guardian = existing
      ? await this.prisma.patient_legal_guardians.update({ where: { id: existing.id }, data })
      : await this.prisma.patient_legal_guardians.create({ data: { tenantId, patientId, ...data } });

    await this.auditService.log({
      tenantId,
      userId,
      action: existing ? 'patient-guardian.update' : 'patient-guardian.create',
      resourceType: 'patient-legal-guardian',
      resourceId: guardian.id,
      result: 'success',
    });

    return guardian;
  }

  async remove(tenantId: string, userId: string, patientId: string) {
    const existing = await this.findOne(tenantId, patientId);
    if (!existing) throw new NotFoundException('No legal guardian on file for this patient');

    await this.prisma.patient_legal_guardians.delete({ where: { id: existing.id } });

    await this.auditService.log({
      tenantId,
      userId,
      action: 'patient-guardian.delete',
      resourceType: 'patient-legal-guardian',
      resourceId: existing.id,
      result: 'success',
    });

    return { deleted: true };
  }
}
