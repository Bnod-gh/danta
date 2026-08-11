import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import { AuditService } from '../audit/audit.service';
import { CreateChair, UpdateChair } from '@danta/schemas';

@Injectable()
export class ChairsService {
  constructor(private readonly prisma: PrismaService, private readonly auditService: AuditService) {}

  async findAll(tenantId: string) {
    return this.prisma.chair.findMany({
      where: { tenantId },
      orderBy: { name: 'asc' },
    });
  }

  async findOne(tenantId: string, id: string) {
    const chair = await this.prisma.chair.findFirst({
      where: { id, tenantId },
    });
    if (!chair) throw new NotFoundException('Chair not found');
    return chair;
  }

  async create(tenantId: string, userId: string, data: CreateChair) {
    const chair = await this.prisma.chair.create({
      data: { tenantId, ...data },
    });

    await this.auditService.log({
      tenantId,
      userId,
      action: 'chair.create',
      resourceType: 'chair',
      resourceId: chair.id,
      result: 'success',
    });

    return chair;
  }

  async update(tenantId: string, userId: string, id: string, data: UpdateChair) {
    const existing = await this.findOne(tenantId, id);
    const chair = await this.prisma.chair.update({
      where: { id: existing.id },
      data,
    });

    await this.auditService.log({
      tenantId,
      userId,
      action: 'chair.update',
      resourceType: 'chair',
      resourceId: chair.id,
      result: 'success',
    });

    return chair;
  }

  async remove(tenantId: string, userId: string, id: string) {
    const existing = await this.findOne(tenantId, id);
    await this.prisma.chair.delete({ where: { id: existing.id } });

    await this.auditService.log({
      tenantId,
      userId,
      action: 'chair.delete',
      resourceType: 'chair',
      resourceId: existing.id,
      result: 'success',
    });

    return { deleted: true };
  }
}
