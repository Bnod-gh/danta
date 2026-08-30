import { Injectable, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import { AuditService } from '../audit/audit.service';

@Injectable()
export class TenantsService {
  constructor(private readonly prisma: PrismaService, private readonly auditService: AuditService) {}

  async approve(tenantId: string, userId: string) {
    const tenant = await this.prisma.organisation.update({
      where: { id: tenantId },
      data: { status: 'active' },
    });
    await this.auditService.log({
      tenantId,
      userId,
      action: 'tenant.approve',
      resourceType: 'organisation',
      resourceId: tenantId,
      result: 'success',
    });
    return tenant;
  }

  async reject(tenantId: string, userId: string) {
    const tenant = await this.prisma.organisation.update({
      where: { id: tenantId },
      data: { status: 'deactivated' },
    });
    await this.auditService.log({
      tenantId,
      userId,
      action: 'tenant.reject',
      resourceType: 'organisation',
      resourceId: tenantId,
      result: 'success',
    });
    return tenant;
  }

  async findPending(platformTenantId: string, userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { role: true },
    });
    if (!user || (user.role !== 'platform_owner' && user.role !== 'platform_admin')) {
      throw new ForbiddenException('Platform administrator access required');
    }
    const tenants = await this.prisma.organisation.findMany({
      where: { status: 'pending' },
      select: {
        id: true,
        name: true,
        status: true,
        createdAt: true,
      },
    });
    await this.auditService.log({
      tenantId: platformTenantId,
      userId,
      action: 'tenant.pending_list',
      resourceType: 'organisation',
      result: 'success',
    });
    return tenants;
  }
}
