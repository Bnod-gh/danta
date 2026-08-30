import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';

@Injectable()
export class TenantsService {
  constructor(private readonly prisma: PrismaService) {}

  async approve(tenantId: string, _userId: string) {
    const tenant = await this.prisma.organisation.update({
      where: { id: tenantId },
      data: { status: 'active' },
    });
    return tenant;
  }

  async reject(tenantId: string, _userId: string) {
    const tenant = await this.prisma.organisation.update({
      where: { id: tenantId },
      data: { status: 'deactivated' },
    });
    return tenant;
  }

  async findPending(_tenantId: string, _userId: string) {
    const tenants = await this.prisma.organisation.findMany({
      where: { status: 'pending' },
    });
    return tenants;
  }

  async findById(id: string) {
    return this.prisma.organisation.findUnique({
      where: { id },
    });
  }
}
