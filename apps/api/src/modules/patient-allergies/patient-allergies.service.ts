import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import { AuditService } from '../audit/audit.service';

@Injectable()
export class PatientAllergiesService {
  constructor(private readonly prisma: PrismaService, private readonly auditService: AuditService) {}

  async findAll(tenantId: string, patientId: string) {
    return this.prisma.patientAllergy.findMany({
      where: { tenantId, patientId },
    });
  }

  async create(tenantId: string, patientId: string, userId: string, data: any) {
    const allergy = await this.prisma.patientAllergy.create({
      data: { tenantId, patientId, ...data },
    });

    await this.auditService.log({
      tenantId,
      userId,
      action: 'patient-allergy.create',
      resourceType: 'patient-allergy',
      resourceId: allergy.id,
      result: 'success',
    });

    return allergy;
  }

  async update(tenantId: string, patientId: string, userId: string, id: string, data: any) {
    const existing = await this.prisma.patientAllergy.findFirst({ where: { id, patientId, tenantId } });
    if (!existing) throw new NotFoundException('Allergy not found');

    const updated = await this.prisma.patientAllergy.update({ where: { id }, data });

    await this.auditService.log({
      tenantId,
      userId,
      action: 'patient-allergy.update',
      resourceType: 'patient-allergy',
      resourceId: updated.id,
      result: 'success',
    });

    return updated;
  }

  async remove(tenantId: string, patientId: string, userId: string, id: string) {
    const existing = await this.prisma.patientAllergy.findFirst({ where: { id, patientId, tenantId } });
    if (!existing) throw new NotFoundException('Allergy not found');

    await this.prisma.patientAllergy.delete({ where: { id } });

    await this.auditService.log({
      tenantId,
      userId,
      action: 'patient-allergy.delete',
      resourceType: 'patient-allergy',
      resourceId: existing.id,
      result: 'success',
    });

    return { deleted: true };
  }
}
