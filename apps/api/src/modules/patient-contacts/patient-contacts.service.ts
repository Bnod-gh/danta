import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import { AuditService } from '../audit/audit.service';

@Injectable()
export class PatientContactsService {
  constructor(private readonly prisma: PrismaService, private readonly auditService: AuditService) {}

  async findAll(tenantId: string, patientId: string) {
    return this.prisma.patientContact.findMany({
      where: { tenantId, patientId },
    });
  }

  async create(tenantId: string, patientId: string, userId: string, data: any) {
    const contact = await this.prisma.patientContact.create({
      data: { tenantId, patientId, ...data },
    });

    await this.auditService.log({
      tenantId,
      userId,
      action: 'patient-contact.create',
      resourceType: 'patient-contact',
      resourceId: contact.id,
      result: 'success',
    });

    return contact;
  }

  async update(tenantId: string, patientId: string, userId: string, id: string, data: any) {
    const contact = await this.prisma.patientContact.findFirst({ where: { id, patientId, tenantId } });
    if (!contact) throw new NotFoundException('Contact not found');

    const updated = await this.prisma.patientContact.update({ where: { id }, data });

    await this.auditService.log({
      tenantId,
      userId,
      action: 'patient-contact.update',
      resourceType: 'patient-contact',
      resourceId: updated.id,
      result: 'success',
    });

    return updated;
  }

  async remove(tenantId: string, patientId: string, userId: string, id: string) {
    const contact = await this.prisma.patientContact.findFirst({ where: { id, patientId, tenantId } });
    if (!contact) throw new NotFoundException('Contact not found');

    await this.prisma.patientContact.delete({ where: { id } });

    await this.auditService.log({
      tenantId,
      userId,
      action: 'patient-contact.delete',
      resourceType: 'patient-contact',
      resourceId: contact.id,
      result: 'success',
    });

    return { deleted: true };
  }
}
