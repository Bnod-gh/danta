import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import { AuditService } from '../audit/audit.service';
import { CreateTreatmentPlan, UpdateTreatmentPlan } from '@danta/schemas';

@Injectable()
export class TreatmentPlansService {
  constructor(private readonly prisma: PrismaService, private readonly auditService: AuditService) {}

  async findAll(tenantId: string, patientId?: string, skip?: number, take?: number) {
    const where: any = { tenantId };
    if (patientId) where.patientId = patientId;

    const [plans, total] = await Promise.all([
      this.prisma.treatmentPlan.findMany({
        where,
        skip: skip ?? 0,
        take: Math.min(take ?? 20, 100),
        include: {
          patient: { select: { id: true, firstName: true, lastName: true } },
          provider: { select: { id: true, firstName: true, lastName: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.treatmentPlan.count({ where }),
    ]);

    return { data: plans, total, skip: skip ?? 0, take: take ?? 20 };
  }

  async findOne(tenantId: string, id: string) {
    const plan = await this.prisma.treatmentPlan.findFirst({
      where: { id, tenantId },
      include: {
        patient: { select: { id: true, firstName: true, lastName: true } },
        provider: { select: { id: true, firstName: true, lastName: true } },
      },
    });
    if (!plan) throw new NotFoundException('Treatment plan not found');
    return plan;
  }

  async create(tenantId: string, userId: string, data: CreateTreatmentPlan) {
    const plan = await this.prisma.treatmentPlan.create({
      data: { tenantId, ...data },
      include: {
        patient: { select: { id: true, firstName: true, lastName: true } },
        provider: { select: { id: true, firstName: true, lastName: true } },
      },
    });

    await this.auditService.log({
      tenantId,
      userId,
      action: 'treatment_plan.create',
      resourceType: 'treatment_plan',
      resourceId: plan.id,
      result: 'success',
    });

    return plan;
  }

  async update(tenantId: string, userId: string, id: string, data: UpdateTreatmentPlan) {
    const existing = await this.findOne(tenantId, id);
    const plan = await this.prisma.treatmentPlan.update({
      where: { id: existing.id },
      data,
      include: {
        patient: { select: { id: true, firstName: true, lastName: true } },
        provider: { select: { id: true, firstName: true, lastName: true } },
      },
    });

    await this.auditService.log({
      tenantId,
      userId,
      action: 'treatment_plan.update',
      resourceType: 'treatment_plan',
      resourceId: plan.id,
      result: 'success',
    });

    return plan;
  }

  async remove(tenantId: string, userId: string, id: string) {
    const existing = await this.findOne(tenantId, id);
    await this.prisma.treatmentPlan.delete({ where: { id: existing.id } });

    await this.auditService.log({
      tenantId,
      userId,
      action: 'treatment_plan.delete',
      resourceType: 'treatment_plan',
      resourceId: existing.id,
      result: 'success',
    });

    return { deleted: true };
  }
}
