import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import { AuditService } from '../audit/audit.service';
import { CreateProvider, UpdateProvider } from '@danta/schemas';

@Injectable()
export class ProvidersService {
  constructor(private readonly prisma: PrismaService, private readonly auditService: AuditService) {}

  async findAll(tenantId: string) {
    return this.prisma.provider.findMany({
      where: { tenantId },
      orderBy: { lastName: 'asc' },
    });
  }

  async findOne(tenantId: string, id: string) {
    const provider = await this.prisma.provider.findFirst({
      where: { id, tenantId },
    });
    if (!provider) throw new NotFoundException('Provider not found');
    return provider;
  }

  async create(tenantId: string, userId: string, data: CreateProvider) {
    const provider = await this.prisma.provider.create({
      data: { tenantId, ...data },
    });

    await this.auditService.log({
      tenantId,
      userId,
      action: 'provider.create',
      resourceType: 'provider',
      resourceId: provider.id,
      result: 'success',
    });

    return provider;
  }

  async update(tenantId: string, userId: string, id: string, data: UpdateProvider) {
    const existing = await this.findOne(tenantId, id);
    const provider = await this.prisma.provider.update({
      where: { id: existing.id },
      data,
    });

    await this.auditService.log({
      tenantId,
      userId,
      action: 'provider.update',
      resourceType: 'provider',
      resourceId: provider.id,
      result: 'success',
    });

    return provider;
  }

  async remove(tenantId: string, userId: string, id: string) {
    const existing = await this.findOne(tenantId, id);
    await this.prisma.provider.delete({ where: { id: existing.id } });

    await this.auditService.log({
      tenantId,
      userId,
      action: 'provider.delete',
      resourceType: 'provider',
      resourceId: existing.id,
      result: 'success',
    });

    return { deleted: true };
  }
}
