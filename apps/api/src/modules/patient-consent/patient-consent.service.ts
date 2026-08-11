import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import { AuditService } from '../audit/audit.service';

@Injectable()
export class PatientConsentService {
  constructor(private readonly prisma: PrismaService, private readonly auditService: AuditService) {}

  async findAll(tenantId: string, patientId: string) {
    return this.prisma.patientConsent.findMany({
      where: { tenantId, patientId },
    });
  }

  async create(tenantId: string, patientId: string, userId: string, data: any) {
    const consent = await this.prisma.patientConsent.create({
      data: { tenantId, patientId, ...data },
    });

    await this.auditService.log({
      tenantId,
      userId,
      action: 'patient-consent.create',
      resourceType: 'patient-consent',
      resourceId: consent.id,
      result: 'success',
    });

    return consent;
  }

  async update(tenantId: string, patientId: string, userId: string, id: string, data: any) {
    const existing = await this.prisma.patientConsent.findFirst({ where: { id, patientId, tenantId } });
    if (!existing) throw new NotFoundException('Consent record not found');

    const updated = await this.prisma.patientConsent.update({ where: { id }, data });

    await this.auditService.log({
      tenantId,
      userId,
      action: 'patient-consent.update',
      resourceType: 'patient-consent',
      resourceId: updated.id,
      result: 'success',
    });

    return updated;
  }

  async remove(tenantId: string, patientId: string, userId: string, id: string) {
    const existing = await this.prisma.patientConsent.findFirst({ where: { id, patientId, tenantId } });
    if (!existing) throw new NotFoundException('Consent record not found');

    await this.prisma.patientConsent.delete({ where: { id } });

    await this.auditService.log({
      tenantId,
      userId,
      action: 'patient-consent.delete',
      resourceType: 'patient-consent',
      resourceId: existing.id,
      result: 'success',
    });

    return { deleted: true };
  }
}
