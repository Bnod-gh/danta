import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import { AuditService } from '../audit/audit.service';

@Injectable()
export class PatientAlertsService {
  constructor(private readonly prisma: PrismaService, private readonly auditService: AuditService) {}

  async findAll(tenantId: string, patientId: string) {
    return this.prisma.patientAlert.findMany({
      where: { tenantId, patientId },
    });
  }

  async create(tenantId: string, patientId: string, userId: string, data: any) {
    const alert = await this.prisma.patientAlert.create({
      data: { tenantId, patientId, ...data },
    });

    await this.auditService.log({
      tenantId,
      userId,
      action: 'patient-alert.create',
      resourceType: 'patient-alert',
      resourceId: alert.id,
      result: 'success',
    });

    return alert;
  }

  async update(tenantId: string, patientId: string, userId: string, id: string, data: any) {
    const existing = await this.prisma.patientAlert.findFirst({ where: { id, patientId, tenantId } });
    if (!existing) throw new NotFoundException('Alert not found');

    const updated = await this.prisma.patientAlert.update({ where: { id }, data });

    await this.auditService.log({
      tenantId,
      userId,
      action: 'patient-alert.update',
      resourceType: 'patient-alert',
      resourceId: updated.id,
      result: 'success',
    });

    return updated;
  }

  async remove(tenantId: string, patientId: string, userId: string, id: string) {
    const existing = await this.prisma.patientAlert.findFirst({ where: { id, patientId, tenantId } });
    if (!existing) throw new NotFoundException('Alert not found');

    await this.prisma.patientAlert.delete({ where: { id } });

    await this.auditService.log({
      tenantId,
      userId,
      action: 'patient-alert.delete',
      resourceType: 'patient-alert',
      resourceId: existing.id,
      result: 'success',
    });

    return { deleted: true };
  }
}
