import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import { AuditService } from '../audit/audit.service';
import { CreateCommunicationPreference, UpdateCommunicationPreference } from '@danta/schemas';

@Injectable()
export class CommunicationPreferencesService {
  constructor(private readonly prisma: PrismaService, private readonly auditService: AuditService) {}

  async findAll(tenantId: string, patientId?: string) {
    const where: any = { tenantId };
    if (patientId) where.patientId = patientId;
    return this.prisma.communicationPreference.findMany({
      where,
      orderBy: { updatedAt: 'desc' },
    });
  }

  async findOne(tenantId: string, id: string) {
    const pref = await this.prisma.communicationPreference.findFirst({
      where: { id, tenantId },
    });
    if (!pref) throw new NotFoundException('Communication preference not found');
    return pref;
  }

  async findByPatient(tenantId: string, patientId: string) {
    const pref = await this.prisma.communicationPreference.findFirst({
      where: { tenantId, patientId },
    });
    if (!pref) throw new NotFoundException('Communication preference not found');
    return pref;
  }

  async create(tenantId: string, userId: string, data: CreateCommunicationPreference) {
    const pref = await this.prisma.communicationPreference.create({
      data: { tenantId, ...data },
    });

    await this.auditService.log({
      tenantId,
      userId,
      action: 'communication_preference.create',
      resourceType: 'communication_preference',
      resourceId: pref.id,
      result: 'success',
    });

    return pref;
  }

  async update(tenantId: string, userId: string, id: string, data: UpdateCommunicationPreference) {
    const existing = await this.findOne(tenantId, id);
    const pref = await this.prisma.communicationPreference.update({
      where: { id: existing.id },
      data,
    });

    await this.auditService.log({
      tenantId,
      userId,
      action: 'communication_preference.update',
      resourceType: 'communication_preference',
      resourceId: pref.id,
      result: 'success',
    });

    return pref;
  }
}
