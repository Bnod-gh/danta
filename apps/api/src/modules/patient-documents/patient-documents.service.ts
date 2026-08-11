import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import { AuditService } from '../audit/audit.service';

@Injectable()
export class PatientDocumentsService {
  constructor(private readonly prisma: PrismaService, private readonly auditService: AuditService) {}

  async findAll(tenantId: string, patientId: string) {
    return this.prisma.patientDocument.findMany({
      where: { tenantId, patientId },
    });
  }

  async create(tenantId: string, patientId: string, userId: string, data: any) {
    const document = await this.prisma.patientDocument.create({
      data: { tenantId, patientId, ...data },
    });

    await this.auditService.log({
      tenantId,
      userId,
      action: 'patient-document.create',
      resourceType: 'patient-document',
      resourceId: document.id,
      result: 'success',
    });

    return document;
  }

  async findOne(tenantId: string, patientId: string, id: string) {
    const document = await this.prisma.patientDocument.findFirst({ where: { id, patientId, tenantId } });
    if (!document) throw new NotFoundException('Document not found');
    return document;
  }

  async update(tenantId: string, patientId: string, userId: string, id: string, data: any) {
    const existing = await this.prisma.patientDocument.findFirst({ where: { id, patientId, tenantId } });
    if (!existing) throw new NotFoundException('Document not found');

    const updated = await this.prisma.patientDocument.update({ where: { id }, data });

    await this.auditService.log({
      tenantId,
      userId,
      action: 'patient-document.update',
      resourceType: 'patient-document',
      resourceId: updated.id,
      result: 'success',
    });

    return updated;
  }

  async remove(tenantId: string, patientId: string, userId: string, id: string) {
    const existing = await this.prisma.patientDocument.findFirst({ where: { id, patientId, tenantId } });
    if (!existing) throw new NotFoundException('Document not found');

    await this.prisma.patientDocument.delete({ where: { id } });

    await this.auditService.log({
      tenantId,
      userId,
      action: 'patient-document.delete',
      resourceType: 'patient-document',
      resourceId: existing.id,
      result: 'success',
    });

    return { deleted: true };
  }
}
