import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import { AuditService } from '../audit/audit.service';
import { CreateCommunicationTemplate, UpdateCommunicationTemplate } from '@danta/schemas';

@Injectable()
export class CommunicationTemplatesService {
  constructor(private readonly prisma: PrismaService, private readonly auditService: AuditService) {}

  async findAll(tenantId: string, category?: string) {
    const where: any = { tenantId };
    if (category) where.category = category;
    return this.prisma.communicationTemplate.findMany({
      where,
      orderBy: { name: 'asc' },
    });
  }

  async findOne(tenantId: string, id: string) {
    const template = await this.prisma.communicationTemplate.findFirst({
      where: { id, tenantId },
    });
    if (!template) throw new NotFoundException('Communication template not found');
    return template;
  }

  async create(tenantId: string, userId: string, data: CreateCommunicationTemplate) {
    const template = await this.prisma.communicationTemplate.create({
      data: { tenantId, ...data },
    });

    await this.auditService.log({
      tenantId,
      userId,
      action: 'communication_template.create',
      resourceType: 'communication_template',
      resourceId: template.id,
      result: 'success',
    });

    return template;
  }

  async update(tenantId: string, userId: string, id: string, data: UpdateCommunicationTemplate) {
    const existing = await this.findOne(tenantId, id);
    const template = await this.prisma.communicationTemplate.update({
      where: { id: existing.id },
      data,
    });

    await this.auditService.log({
      tenantId,
      userId,
      action: 'communication_template.update',
      resourceType: 'communication_template',
      resourceId: template.id,
      result: 'success',
    });

    return template;
  }

  async remove(tenantId: string, userId: string, id: string) {
    const existing = await this.findOne(tenantId, id);
    await this.prisma.communicationTemplate.delete({ where: { id: existing.id } });

    await this.auditService.log({
      tenantId,
      userId,
      action: 'communication_template.delete',
      resourceType: 'communication_template',
      resourceId: existing.id,
      result: 'success',
    });

    return { deleted: true };
  }
}
