import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import { AuditService } from '../audit/audit.service';
import { CreateImagingIntegration, UpdateImagingIntegration } from '@danta/schemas';

@Injectable()
export class ImagingIntegrationsService {
  constructor(private readonly prisma: PrismaService, private readonly auditService: AuditService) {}

  async findAll(tenantId: string) {
    return this.prisma.imagingIntegration.findMany({
      where: { tenantId },
      orderBy: { name: 'asc' },
    });
  }

  async findOne(tenantId: string, id: string) {
    const integration = await this.prisma.imagingIntegration.findFirst({
      where: { id, tenantId },
    });
    if (!integration) throw new NotFoundException('Imaging integration not found');
    return integration;
  }

  async create(tenantId: string, userId: string, data: CreateImagingIntegration) {
    const integration = await this.prisma.imagingIntegration.create({
      data: { tenantId, ...data },
    });

    await this.auditService.log({
      tenantId,
      userId,
      action: 'imaging_integration.create',
      resourceType: 'imaging_integration',
      resourceId: integration.id,
      result: 'success',
    });

    return integration;
  }

  async update(tenantId: string, userId: string, id: string, data: UpdateImagingIntegration) {
    const existing = await this.findOne(tenantId, id);
    const integration = await this.prisma.imagingIntegration.update({
      where: { id: existing.id },
      data,
    });

    await this.auditService.log({
      tenantId,
      userId,
      action: 'imaging_integration.update',
      resourceType: 'imaging_integration',
      resourceId: integration.id,
      result: 'success',
    });

    return integration;
  }

  async remove(tenantId: string, userId: string, id: string) {
    const existing = await this.findOne(tenantId, id);
    await this.prisma.imagingIntegration.delete({ where: { id: existing.id } });

    await this.auditService.log({
      tenantId,
      userId,
      action: 'imaging_integration.delete',
      resourceType: 'imaging_integration',
      resourceId: existing.id,
      result: 'success',
    });

    return { deleted: true };
  }
}
