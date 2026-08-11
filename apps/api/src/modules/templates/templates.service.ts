import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import { AuditService } from '../audit/audit.service';
import { CreateTemplate, UpdateTemplate } from '@danta/schemas';

@Injectable()
export class TemplatesService {
  constructor(private readonly prisma: PrismaService, private readonly auditService: AuditService) {}

  async findAll(tenantId: string) {
    return this.prisma.template.findMany({
      where: { tenantId },
      orderBy: { category: 'asc' },
    });
  }

  async findOne(tenantId: string, id: string) {
    const template = await this.prisma.template.findFirst({
      where: { id, tenantId },
    });
    if (!template) throw new NotFoundException('Template not found');
    return template;
  }

  async create(tenantId: string, userId: string, data: CreateTemplate) {
    const template = await this.prisma.template.create({
      data: { tenantId, ...data },
    });

    await this.auditService.log({
      tenantId,
      userId,
      action: 'template.create',
      resourceType: 'template',
      resourceId: template.id,
      result: 'success',
    });

    return template;
  }

  async update(tenantId: string, userId: string, id: string, data: UpdateTemplate) {
    const existing = await this.findOne(tenantId, id);
    const template = await this.prisma.template.update({
      where: { id: existing.id },
      data,
    });

    await this.auditService.log({
      tenantId,
      userId,
      action: 'template.update',
      resourceType: 'template',
      resourceId: template.id,
      result: 'success',
    });

    return template;
  }

  async remove(tenantId: string, userId: string, id: string) {
    const existing = await this.findOne(tenantId, id);
    await this.prisma.template.delete({ where: { id: existing.id } });

    await this.auditService.log({
      tenantId,
      userId,
      action: 'template.delete',
      resourceType: 'template',
      resourceId: existing.id,
      result: 'success',
    });

    return { deleted: true };
  }
}
