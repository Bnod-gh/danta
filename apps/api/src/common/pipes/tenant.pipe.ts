import { Injectable, ForbiddenException } from '@nestjs/common';
import { PipeTransform } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import { AuthenticatedUser } from '../decorators/current-user.decorator';

@Injectable()
export class TenantPipe implements PipeTransform<string> {
  constructor(private readonly prisma: PrismaService) {}

  async transform(tenantId: string) {
    const tenant = await this.prisma.organisation.findUnique({
      where: { id: tenantId },
    });

    if (!tenant || tenant.status === 'suspended' || tenant.status === 'deactivated') {
      throw new ForbiddenException('Tenant is suspended or deactivated');
    }

    return tenantId;
  }

  async validateTenant(user: AuthenticatedUser): Promise<void> {
    const tenant = await this.prisma.organisation.findUnique({
      where: { id: user.tenantId },
    });

    if (!tenant || tenant.status === 'suspended' || tenant.status === 'deactivated') {
      throw new ForbiddenException('Tenant is suspended or deactivated');
    }
  }
}
