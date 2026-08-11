import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import { AuditService } from '../audit/audit.service';
import { CreateDentalChart, UpdateDentalChart } from '@danta/schemas';

@Injectable()
export class DentalChartsService {
  constructor(private readonly prisma: PrismaService, private readonly auditService: AuditService) {}

  async findAll(tenantId: string, patientId?: string) {
    const where: any = { tenantId };
    if (patientId) where.patientId = patientId;
    return this.prisma.dentalChart.findMany({
      where,
      include: { conditions: true },
      orderBy: { chartDate: 'desc' },
    });
  }

  async findOne(tenantId: string, id: string) {
    const chart = await this.prisma.dentalChart.findFirst({
      where: { id, tenantId },
      include: { conditions: true },
    });
    if (!chart) throw new NotFoundException('Dental chart not found');
    return chart;
  }

  async create(tenantId: string, userId: string, data: CreateDentalChart) {
    const chart = await this.prisma.dentalChart.create({
      data: { tenantId, ...data },
      include: { conditions: true },
    });

    await this.auditService.log({
      tenantId,
      userId,
      action: 'dental_chart.create',
      resourceType: 'dental_chart',
      resourceId: chart.id,
      result: 'success',
    });

    return chart;
  }

  async update(tenantId: string, userId: string, id: string, data: UpdateDentalChart) {
    const existing = await this.findOne(tenantId, id);
    const chart = await this.prisma.dentalChart.update({
      where: { id: existing.id },
      data,
      include: { conditions: true },
    });

    await this.auditService.log({
      tenantId,
      userId,
      action: 'dental_chart.update',
      resourceType: 'dental_chart',
      resourceId: chart.id,
      result: 'success',
    });

    return chart;
  }

  async remove(tenantId: string, userId: string, id: string) {
    const existing = await this.findOne(tenantId, id);
    await this.prisma.dentalChart.delete({ where: { id: existing.id } });

    await this.auditService.log({
      tenantId,
      userId,
      action: 'dental_chart.delete',
      resourceType: 'dental_chart',
      resourceId: existing.id,
      result: 'success',
    });

    return { deleted: true };
  }
}
