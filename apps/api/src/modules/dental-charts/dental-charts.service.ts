import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import { AuditService } from '../audit/audit.service';
import { CreateDentalChart, UpdateDentalChart, BatchCreateToothCondition, GeneratePlanFromChart, ChartPlanLine } from '@danta/schemas';

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

  async batchCreateConditions(tenantId: string, userId: string, chartId: string, data: Omit<BatchCreateToothCondition, 'dentalChartId'>) {
    const chart = await this.findOne(tenantId, chartId);
    const created = await this.prisma.toothCondition.createMany({
      data: data.teeth.map((toothNumber) => ({
        tenantId,
        dentalChartId: chart.id,
        toothNumber,
        condition: data.condition,
        scope: data.scope ?? 'tooth',
        dentition: data.dentition ?? 'permanent',
        surfaces: data.surfaces ?? [],
        surface: data.surfaces?.[0] ?? null,
        severity: data.severity ?? null,
        status: data.status ?? 'planned',
        notes: data.notes ?? null,
        providerId: data.providerId ?? null,
        procedureCodeId: data.procedureCodeId ?? null,
        createdByUserId: userId,
        clinicalModule: data.clinicalModule ?? null,
      })),
    });

    await this.auditService.log({
      tenantId,
      userId,
      action: 'tooth_condition.batch_create',
      resourceType: 'tooth_condition',
      resourceId: chart.id,
      result: 'success',
    });

    return { created: created.count, ids: [] };
  }

  async generatePlanFromChart(tenantId: string, userId: string, chartId: string, data: GeneratePlanFromChart) {
    const chart = await this.findOne(tenantId, chartId);

    const conditions = await this.prisma.toothCondition.findMany({
      where: { tenantId, dentalChartId: chartId, status: { in: ['planned', 'existing'] } },
      orderBy: { createdAt: 'asc' },
    });

    if (conditions.length === 0) {
      throw new BadRequestException('No charted conditions map to planned treatment yet');
    }

    const configs = await this.prisma.toothConditionConfig.findMany({
      where: { tenantId, code: { in: conditions.map((c) => c.condition) } },
    });
    const configMap = new Map(configs.map((c) => [c.code, c]));

    const items: ChartPlanLine[] = [];
    for (const condition of conditions) {
      const config = configMap.get(condition.condition);
      if (!config?.cdtCode) continue;
      items.push({
        condition: condition.condition,
        label: config.name ?? condition.condition,
        toothNumber: condition.toothNumber ?? '',
        surface: condition.surface ?? null,
        code: config.cdtCode,
        description: config.cdtDescription ?? config.name ?? condition.condition,
        defaultFee: Number(config.cdtFee ?? 0),
      });
    }

    if (items.length === 0) {
      throw new BadRequestException('No charted conditions map to planned treatment yet');
    }

    const estimatedTotal = items.reduce((sum, item) => sum + item.defaultFee, 0);

    let resolvedProviderId = data.providerId;
    if (!resolvedProviderId) {
      const provider = await this.prisma.provider.findFirst({
        where: { tenantId, isActive: true },
        orderBy: { createdAt: 'asc' },
      });
      if (!provider) {
        throw new NotFoundException('No active provider available to assign to the treatment plan');
      }
      resolvedProviderId = provider.id;
    }

    const plan = await this.prisma.treatmentPlan.create({
      data: {
        tenantId,
        patientId: chart.patientId,
        providerId: resolvedProviderId,
        name: `Generated from chart ${chart.id.slice(0, 8)}`,
        status: 'proposed',
      },
      include: {
        patient: { select: { id: true, firstName: true, lastName: true } },
        provider: { select: { id: true, firstName: true, lastName: true } },
      },
    });

    await this.prisma.treatment_plan_items.createMany({
      data: items.map((item) => ({
        tenantId,
        planId: plan.id,
        treatmentCode: item.code,
        description: item.label,
        toothNumber: item.toothNumber || null,
        surfaces: item.surface ? [item.surface] : [],
        unitPrice: item.defaultFee,
        status: 'planned',
      })),
    });

    await this.auditService.log({
      tenantId,
      userId,
      action: 'treatment_plan.generate_from_chart',
      resourceType: 'treatment_plan',
      resourceId: plan.id,
      result: 'success',
    });

    return {
      plan: { id: plan.id, name: plan.name },
      items,
      estimatedTotal,
    };
  }
}
