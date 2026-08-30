import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import { AuditService } from '../audit/audit.service';
import {
  CreateEstimate,
  CreateEstimateFromPlan,
  RecordEstimateDecision,
} from '@danta/schemas';
import type { Prisma } from '@prisma/client';

const APPROVABLE_STATUSES = ['presented'];

interface EstimateItemInput {
  planItemId?: string;
  serviceId?: string;
  cdtCode?: string;
  description: string;
  toothNumber?: string;
  surfaces?: string[];
  quantity?: number;
  unitPrice: number;
  discount?: number;
  taxRate?: number;
}

@Injectable()
export class EstimatesService {
  constructor(private readonly prisma: PrismaService, private readonly auditService: AuditService) {}

  async findAll(tenantId: string, filters: { patientId?: string; status?: string; treatmentPlanId?: string }, skip = 0, take = 20) {
    const where: Prisma.EstimateWhereInput = { tenantId };
    if (filters.patientId) where.patientId = filters.patientId;
    if (filters.status) where.status = filters.status as never;
    if (filters.treatmentPlanId) where.treatmentPlanId = filters.treatmentPlanId;
    return this.prisma.estimate.findMany({
      where,
      include: { estimate_items: true },
      orderBy: { createdAt: 'desc' },
      skip,
      take,
    });
  }

  async findOne(tenantId: string, id: string) {
    const estimate = await this.prisma.estimate.findFirst({
      where: { id, tenantId },
      include: { estimate_items: { orderBy: { sortOrder: 'asc' } }, estimate_approvals: { orderBy: { signedAt: 'desc' } } },
    });
    if (!estimate) throw new NotFoundException('Estimate not found');
    return estimate;
  }

  /** Builds an estimate directly from a treatment plan's planned/accepted items. */
  async createFromPlan(tenantId: string, userId: string, data: CreateEstimateFromPlan) {
    const plan = await this.prisma.treatmentPlan.findFirst({
      where: { id: data.treatmentPlanId, tenantId },
      include: { treatment_plan_items: true },
    });
    if (!plan) throw new NotFoundException('Treatment plan not found');

    const eligible = plan.treatment_plan_items.filter(
      (i) => ['planned', 'accepted'].includes(i.status) && (!data.itemIds || data.itemIds.includes(i.id)),
    );
    if (eligible.length === 0) throw new BadRequestException('The treatment plan has no planned items to estimate');

    const inputs: EstimateItemInput[] = eligible.map((item) => ({
      planItemId: item.id,
      serviceId: item.serviceId ?? undefined,
      cdtCode: item.treatmentCode ?? undefined,
      description: item.description,
      toothNumber: item.toothNumber ?? undefined,
      surfaces: item.surfaces,
      quantity: item.quantity,
      unitPrice: Number(item.unitPrice),
      discount: Number(item.discount),
      taxRate: Number(item.taxRate),
    }));

    return this.createInternal(tenantId, userId, {
      patientId: plan.patientId,
      providerId: plan.providerId,
      treatmentPlanId: plan.id,
      items: inputs,
      validUntil: data.validUntil ? new Date(data.validUntil) : undefined,
      notes: data.notes,
    });
  }

  async create(tenantId: string, userId: string, data: CreateEstimate) {
    return this.createInternal(tenantId, userId, {
      patientId: data.patientId,
      providerId: data.providerId,
      treatmentPlanId: data.treatmentPlanId,
      items: data.items,
      validUntil: data.validUntil ? new Date(data.validUntil) : undefined,
      notes: data.notes,
    });
  }

  /** draft → presented */
  async present(tenantId: string, userId: string, id: string) {
    const estimate = await this.findOne(tenantId, id);
    if (estimate.status !== 'draft') throw new ConflictException('Only draft estimates can be presented');
    const updated = await this.prisma.estimate.update({
      where: { id: estimate.id },
      data: { status: 'presented', presentedAt: new Date() },
    });

    await this.auditService.log({
      tenantId,
      userId,
      action: 'estimate.present',
      resourceType: 'estimate',
      resourceId: id,
      result: 'success',
    });
    void updated;
    return this.findOne(tenantId, id);
  }

  /**
   * Records the patient decision. The approval row is immutable evidence
   * (signer, method, ip, user-agent); the estimate itself is never edited afterwards.
   */
  async decide(
    tenantId: string,
    userId: string,
    id: string,
    body: RecordEstimateDecision,
    context: { ip?: string; userAgent?: string },
  ) {
    const estimate = await this.findOne(tenantId, id);
    if (!APPROVABLE_STATUSES.includes(estimate.status)) {
      throw new ConflictException(`A ${estimate.status} estimate cannot receive a new patient decision`);
    }
    if (estimate.validUntil && estimate.validUntil.getTime() < Date.now()) {
      throw new ConflictException('This estimate has expired — present an updated version instead');
    }

    const updated = await this.prisma.$transaction(async (tx) => {
      await tx.estimate_approvals.create({
        data: {
          tenantId,
          estimateId: estimate.id,
          decision: body.decision,
          signerName: body.signerName,
          method: body.method,
          approvedByUserId: userId,
          ipAddress: context.ip?.slice(0, 64),
          userAgent: context.userAgent?.slice(0, 255),
          metadata: body.note ? { note: body.note } : undefined,
        },
      });

      const status =
        body.decision === 'approved' ? 'approved' : body.decision === 'rejected' ? 'rejected' : 'partially_approved';

      // Sync linked plan item acceptance so downstream scheduling/invoicing sees the outcome.
      const linkedItemIds = estimate.estimate_items.map((i) => i.planItemId).filter((v): v is string => Boolean(v));
      if (linkedItemIds.length > 0) {
        const nextItemStatus = body.decision === 'approved' ? 'accepted' : body.decision === 'rejected' ? 'declined' : null;
        if (nextItemStatus) {
          await tx.treatment_plan_items.updateMany({
            where: { id: { in: linkedItemIds }, status: 'planned' },
            data: { status: nextItemStatus },
          });
        }
      }

      return tx.estimate.update({
        where: { id: estimate.id },
        data: {
          status,
          approvedAt: body.decision !== 'rejected' ? new Date() : null,
          rejectedAt: body.decision === 'rejected' ? new Date() : null,
        },
      });
    });

    await this.auditService.log({
      tenantId,
      userId,
      action: `estimate.${body.decision}`,
      resourceType: 'estimate',
      resourceId: id,
      metadata: { signerName: body.signerName, method: body.method },
      result: 'success',
    });
    void updated;
    return this.findOne(tenantId, id);
  }

  async cancel(tenantId: string, userId: string, id: string) {
    const estimate = await this.findOne(tenantId, id);
    if (['approved', 'cancelled', 'rejected'].includes(estimate.status)) {
      throw new ConflictException(`A ${estimate.status} estimate cannot be cancelled`);
    }
    await this.prisma.estimate.update({
      where: { id: estimate.id },
      data: { status: 'cancelled', cancelledAt: new Date() },
    });

    await this.auditService.log({
      tenantId,
      userId,
      action: 'estimate.cancel',
      resourceType: 'estimate',
      resourceId: id,
      result: 'success',
    });
    return this.findOne(tenantId, id);
  }

  private async createInternal(
    tenantId: string,
    userId: string,
    input: {
      patientId: string;
      providerId?: string;
      treatmentPlanId?: string;
      items: EstimateItemInput[];
      validUntil?: Date;
      notes?: string;
    },
  ) {
    const patient = await this.prisma.patient.findFirst({ where: { id: input.patientId, tenantId }, select: { id: true } });
    if (!patient) throw new NotFoundException('Patient not found');
    if (input.providerId) {
      const provider = await this.prisma.provider.findFirst({ where: { id: input.providerId, tenantId }, select: { id: true } });
      if (!provider) throw new NotFoundException('Provider not found in this practice');
    }

    const lineTotals = input.items.map((item) => {
      const quantity = item.quantity ?? 1;
      const discount = item.discount ?? 0;
      const taxRate = item.taxRate ?? 0;
      const base = quantity * item.unitPrice - discount;
      return { ...item, quantity, discount, taxRate, total: Math.round(base * 100) / 100 };
    });
    const subtotal = lineTotals.reduce((sum, i) => sum + i.quantity * i.unitPrice, 0);
    const discountTotal = lineTotals.reduce((sum, i) => sum + i.discount, 0);
    const tax = lineTotals.reduce((sum, i) => sum + (i.quantity * i.unitPrice - i.discount) * (i.taxRate / 100), 0);
    const total = subtotal - discountTotal + tax;

    const estimateNumber = await this.generateEstimateNumber(tenantId);

    const created = await this.prisma.$transaction(async (tx) =>
      tx.estimate.create({
        data: {
          tenantId,
          patientId: input.patientId,
          providerId: input.providerId,
          treatmentPlanId: input.treatmentPlanId,
          createdByUserId: userId,
          estimateNumber,
          subtotal,
          discount: discountTotal,
          tax: Math.round(tax * 100) / 100,
          total: Math.round(total * 100) / 100,
          validUntil: input.validUntil,
          notes: input.notes,
          estimate_items: {
            create: lineTotals.map((item, index) => ({
              tenantId,
              planItemId: item.planItemId,
              serviceId: item.serviceId,
              cdtCode: item.cdtCode,
              description: item.description,
              toothNumber: item.toothNumber,
              surfaces: item.surfaces ?? [],
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              discount: item.discount,
              taxRate: item.taxRate,
              total: item.total,
              sortOrder: index,
            })),
          },
        },
        include: { estimate_items: true },
      }),
    );

    await this.auditService.log({
      tenantId,
      userId,
      action: 'estimate.create',
      resourceType: 'estimate',
      resourceId: created.id,
      metadata: { estimateNumber, total: created.total, itemCount: lineTotals.length },
      result: 'success',
    });
    return created;
  }

  private async generateEstimateNumber(tenantId: string): Promise<string> {
    const count = await this.prisma.estimate.count({ where: { tenantId } });
    return `EST-${String(count + 1).padStart(6, '0')}`;
  }
}
