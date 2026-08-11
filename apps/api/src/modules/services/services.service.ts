import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import { AuditService } from '../audit/audit.service';
import { CreateService, UpdateService } from '@danta/schemas';

@Injectable()
export class ServicesService {
  constructor(private readonly prisma: PrismaService, private readonly auditService: AuditService) {}

  async findAll(tenantId: string, category?: string) {
    const where: any = { tenantId };
    if (category) where.category = category;
    return this.prisma.service.findMany({
      where,
      orderBy: { name: 'asc' },
    });
  }

  async findOne(tenantId: string, id: string) {
    const service = await this.prisma.service.findFirst({
      where: { id, tenantId },
    });
    if (!service) throw new NotFoundException('Service not found');
    return service;
  }

  async create(tenantId: string, userId: string, data: CreateService) {
    const service = await this.prisma.service.create({
      data: { tenantId, ...data },
    });

    await this.auditService.log({
      tenantId,
      userId,
      action: 'service.create',
      resourceType: 'service',
      resourceId: service.id,
      result: 'success',
    });

    return service;
  }

  async update(tenantId: string, userId: string, id: string, data: UpdateService) {
    const existing = await this.findOne(tenantId, id);
    const service = await this.prisma.service.update({
      where: { id: existing.id },
      data,
    });

    await this.auditService.log({
      tenantId,
      userId,
      action: 'service.update',
      resourceType: 'service',
      resourceId: service.id,
      result: 'success',
    });

    return service;
  }

  async remove(tenantId: string, userId: string, id: string) {
    const existing = await this.findOne(tenantId, id);
    await this.prisma.service.delete({ where: { id: existing.id } });

    await this.auditService.log({
      tenantId,
      userId,
      action: 'service.delete',
      resourceType: 'service',
      resourceId: existing.id,
      result: 'success',
    });

    return { deleted: true };
  }
}
