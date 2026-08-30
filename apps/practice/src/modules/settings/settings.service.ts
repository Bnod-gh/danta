import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';

@Injectable()
export class SettingsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(tenantId: string) {
    return this.prisma.tenantSetting.findMany({
      where: { tenantId },
    });
  }

  async upsert(tenantId: string, key: string, value: Record<string, any>, _userId?: string) {
    const setting = await this.prisma.tenantSetting.upsert({
      where: { tenantId_key: { tenantId, key } },
      update: { value },
      create: { tenantId, key, value },
    });

    return setting;
  }
}
