import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import { AuditService } from '../audit/audit.service';
import { UpsertMedicalContext } from '@danta/schemas';

@Injectable()
export class PatientMedicalContextService {
  constructor(private readonly prisma: PrismaService, private readonly auditService: AuditService) {}

  async findOne(tenantId: string, patientId: string) {
    const context = await this.prisma.patient_medical_context.findFirst({
      where: { patientId, tenantId },
    });
    if (!context) {
      return {
        id: null,
        tenantId,
        patientId,
        isPregnant: false,
        pregnancyWeek: null,
        isLactating: false,
        isOnAnticoagulants: false,
        anticoagulantMedication: null,
        inrValue: null,
        lastInrDate: null,
        isSmoker: false,
        smokingFrequency: null,
        alcoholConsumption: null,
        bruxism: false,
        adverseAnesthesiaReaction: false,
        anesthesiaReactionDetails: null,
        createdAt: null,
        updatedAt: null,
      };
    }
    return context;
  }

  async upsert(tenantId: string, patientId: string, userId: string, data: UpsertMedicalContext) {
    const existing = await this.prisma.patient_medical_context.findFirst({
      where: { patientId, tenantId },
    });

    let context;
    if (existing) {
      context = await this.prisma.patient_medical_context.update({
        where: { id: existing.id },
        data,
      });
    } else {
      context = await this.prisma.patient_medical_context.create({
        data: { tenantId, patientId, ...data },
      });
    }

    await this.auditService.log({
      tenantId,
      userId,
      action: existing ? 'patient-medical-context.update' : 'patient-medical-context.create',
      resourceType: 'patient-medical-context',
      resourceId: context.id,
      result: 'success',
    });

    return context;
  }
}
