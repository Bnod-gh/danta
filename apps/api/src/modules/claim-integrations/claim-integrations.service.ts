import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import { AuditService } from '../audit/audit.service';
import { CreateClaimIntegration, UpdateClaimIntegration } from '@danta/schemas';

@Injectable()
export class ClaimIntegrationsService {
  constructor(private readonly prisma: PrismaService, private readonly auditService: AuditService) {}

  async findAll(tenantId: string, provider?: string) {
    const where: any = { tenantId };
    if (provider) where.provider = provider;
    return this.prisma.claimIntegration.findMany({
      where,
      orderBy: { name: 'asc' },
    });
  }

  async findOne(tenantId: string, id: string) {
    const integration = await this.prisma.claimIntegration.findFirst({
      where: { id, tenantId },
    });
    if (!integration) throw new NotFoundException('Claim integration not found');
    return integration;
  }

  async create(tenantId: string, userId: string, data: CreateClaimIntegration) {
    const integration = await this.prisma.claimIntegration.create({
      data: { tenantId, ...data },
    });

    await this.auditService.log({
      tenantId,
      userId,
      action: 'claim_integration.create',
      resourceType: 'claim_integration',
      resourceId: integration.id,
      result: 'success',
    });

    return integration;
  }

  async update(tenantId: string, userId: string, id: string, data: UpdateClaimIntegration) {
    const existing = await this.findOne(tenantId, id);
    const integration = await this.prisma.claimIntegration.update({
      where: { id: existing.id },
      data,
    });

    await this.auditService.log({
      tenantId,
      userId,
      action: 'claim_integration.update',
      resourceType: 'claim_integration',
      resourceId: integration.id,
      result: 'success',
    });

    return integration;
  }

  async remove(tenantId: string, userId: string, id: string) {
    const existing = await this.findOne(tenantId, id);
    await this.prisma.claimIntegration.delete({ where: { id: existing.id } });

    await this.auditService.log({
      tenantId,
      userId,
      action: 'claim_integration.delete',
      resourceType: 'claim_integration',
      resourceId: existing.id,
      result: 'success',
    });

    return { deleted: true };
  }
}
