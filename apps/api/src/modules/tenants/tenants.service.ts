import { Injectable } from '@nestjs/common';
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
}
