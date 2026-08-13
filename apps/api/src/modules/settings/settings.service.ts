import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import { AuditService } from '../audit/audit.service';

@Injectable()
export class SettingsService {
  constructor(private readonly prisma: PrismaService, private readonly auditService: AuditService) {}

  async findAll(tenantId: string) {
    return this.prisma.tenantSetting.findMany({
      where: { tenantId },
    });
  }

  async upsert(tenantId: string, key: string, value: Record<string, any>, userId?: string) {
    const setting = await this.prisma.tenantSetting.upsert({
      where: { tenantId_key: { tenantId, key } },
      update: { value },
      create: { tenantId, key, value },
    });

    await this.auditService.log({
      tenantId,
      userId,
      action: 'settings.updated',
      resourceType: 'setting',
      resourceId: setting.id,
      result: 'success',
      metadata: { key },
    });

    return setting;
  }
}
