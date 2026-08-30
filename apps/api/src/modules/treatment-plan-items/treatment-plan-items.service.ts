import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import { AuditService } from '../audit/audit.service';
import {
  CreateTreatmentPlanItem,
  UpdateTreatmentPlanItem,
  TransitionTreatmentPlanItem,
  PLAN_ITEM_TRANSITIONS,
  isValidToothNumber,
} from '@danta/schemas';
import type { Prisma, TreatmentPlanItemStatus } from '@prisma/client';

const EDITABLE_PLAN_STATUSES = ['draft', 'proposed'];
const EDITABLE_ITEM_STATUSES: TreatmentPlanItemStatus[] = ['planned', 'declined', 'cancelled'];

@Injectable()
export class TreatmentPlanItemsService {
  constructor(private readonly prisma: PrismaService, private readonly auditService: AuditService) {}

  async findAll(tenantId: string, filters: { planId?: string; patientId?: string; status?: string; statuses?: string[] }) {
    const where: Prisma.treatment_plan_itemsWhereInput = { tenantId };
    if (filters.planId) where.planId = filters.planId;
    if (filters.patientId) where.treatment_plans = { patientId: filters.patientId };
    if (filters.statuses?.length) {
      where.status = { in: filters.statuses as TreatmentPlanItemStatus[] };
    } else if (filters.status) {
      where.status = filters.status as TreatmentPlanItemStatus;
    }
    return this.prisma.treatment_plan_items.findMany({
      where,
      orderBy: [{ planId: 'asc' }, { createdAt: 'asc' }],
    });
  }

  async findOne(tenantId: string, id: string) {
    const item = await this.prisma.treatment_plan_items.findFirst({ where: { id, tenantId } });
    if (!item) throw new NotFoundException('Treatment plan item not found');
    return item;
  }

  async create(tenantId: string, userId: string, data: CreateTreatmentPlanItem) {
    if (data.toothNumber && !isValidToothNumber(data.toothNumber)) {
      throw new BadRequestException('Tooth must be a valid FDI number (e.g. 16) or Universal number (1-32)');
    }
    const plan = await this.prisma.treatmentPlan.findFirst({
      where: { id: data.planId, tenantId },
      select: { id: true, status: true, patientId: true },
    });
    if (!plan) throw new NotFoundException('Treatment plan not found');
    if (!EDITABLE_PLAN_STATUSES.includes(plan.status)) {
      throw new ConflictException('This plan has been accepted — create a new plan version instead of editing it');
    }
    if (data.toothNumber) {
      const belongs = await this.prisma.patient.findFirst({ where: { id: plan.patientId, tenantId }, select: { id: true } });
      if (!belongs) throw new NotFoundException('Treatment plan not found');
    }
    await this.assertForeignKeys(tenantId, data.serviceId, data.providerId, data.appointmentId);

    const item = await this.prisma.treatment_plan_items.create({
      data: {
        tenantId,
        planId: data.planId,
        serviceId: data.serviceId,
        providerId: data.providerId,
        appointmentId: data.appointmentId,
        treatmentCode: data.treatmentCode,
        description: data.description,
        toothNumber: data.toothNumber,
        surfaces: data.surfaces ?? [],
        quantity: data.quantity,
        unitPrice: data.unitPrice,
        discount: data.discount,
        taxRate: data.taxRate,
        estimatedMinutes: data.estimatedMinutes,
        priority: data.priority,
        notes: data.notes,
        status: 'planned',
      },
    });

    await this.auditService.log({
      tenantId,
      userId,
      action: 'treatment_plan_item.create',
      resourceType: 'treatment_plan_item',
      resourceId: item.id,
      metadata: { planId: plan.id, toothNumber: item.toothNumber },
      result: 'success',
    });
    return item;
  }

  async update(tenantId: string, userId: string, id: string, data: UpdateTreatmentPlanItem) {
    const existing = await this.findOne(tenantId, id);
    if (!EDITABLE_ITEM_STATUSES.includes(existing.status as TreatmentPlanItemStatus)) {
      throw new ConflictException('Accepted or completed treatment items can no longer be edited');
    }
    if (data.expectedUpdatedAt && new Date(data.expectedUpdatedAt).getTime() !== existing.updatedAt.getTime()) {
      throw new ConflictException('This treatment item was changed by another user. Refresh before saving.');
    }
    if (data.toothNumber && !isValidToothNumber(data.toothNumber)) {
      throw new BadRequestException('Tooth must be a valid FDI number (e.g. 16) or Universal number (1-32)');
    }

    const patch: Prisma.treatment_plan_itemsUpdateInput = {};
    if (data.description !== undefined) patch.description = data.description;
    if (data.treatmentCode !== undefined) patch.treatmentCode = data.treatmentCode;
    if (data.toothNumber !== undefined) patch.toothNumber = data.toothNumber;
    if (data.surfaces !== undefined) patch.surfaces = { set: data.surfaces };
    if (data.quantity !== undefined) patch.quantity = data.quantity;
    if (data.unitPrice !== undefined) patch.unitPrice = data.unitPrice;
    if (data.discount !== undefined) patch.discount = data.discount;
    if (data.taxRate !== undefined) patch.taxRate = data.taxRate;
    if (data.estimatedMinutes !== undefined) patch.estimatedMinutes = data.estimatedMinutes;
    if (data.priority !== undefined) patch.priority = data.priority;
    if (data.notes !== undefined) patch.notes = data.notes;
    if (data.serviceId !== undefined) patch.services = data.serviceId ? { connect: { id: data.serviceId } } : { disconnect: true } as any;
    if (data.providerId !== undefined) patch.providers = data.providerId ? { connect: { id: data.providerId } } : { disconnect: true } as any;

    const item = await this.prisma.treatment_plan_items.update({ where: { id: existing.id }, data: patch });

    await this.auditService.log({
      tenantId,
      userId,
      action: 'treatment_plan_item.update',
      resourceType: 'treatment_plan_item',
      resourceId: item.id,
      result: 'success',
    });
    return item;
  }

  async transition(tenantId: string, userId: string, id: string, data: TransitionTreatmentPlanItem) {
    const existing = await this.findOne(tenantId, id);
    const current = existing.status as TreatmentPlanItemStatus;
    if (!PLAN_ITEM_TRANSITIONS[current]?.includes(data.status)) {
      throw new ConflictException(`A treatment item cannot move from ${current} to ${data.status}`);
    }
    if (data.expectedUpdatedAt && new Date(data.expectedUpdatedAt).getTime() !== existing.updatedAt.getTime()) {
      throw new ConflictException('This treatment item was changed by another user. Refresh before saving.');
    }
    if (data.status === 'scheduled' && !existing.appointmentId && !data.appointmentId) {
      throw new BadRequestException('An appointment must be linked before the item can be scheduled');
    }

    const patch: Prisma.treatment_plan_itemsUpdateInput = { status: data.status };
    if (data.appointmentId) {
      await this.assertAppointment(tenantId, data.appointmentId);
      patch.appointments = { connect: { id: data.appointmentId } } as any;
    }
    if (data.status === 'completed') patch.completedAt = new Date();

    const item = await this.prisma.treatment_plan_items.update({ where: { id: existing.id }, data: patch });

    await this.auditService.log({
      tenantId,
      userId,
      action: 'treatment_plan_item.transition',
      resourceType: 'treatment_plan_item',
      resourceId: item.id,
      metadata: { from: current, to: data.status, note: data.note },
      result: 'success',
    });
    return item;
  }

  /** Cancelling keeps the row so plan history stays complete. */
  async cancel(tenantId: string, userId: string, id: string) {
    const existing = await this.findOne(tenantId, id);
    if (['completed', 'cancelled'].includes(existing.status)) {
      throw new ConflictException(`A ${existing.status} treatment item cannot be cancelled`);
    }
    const item = await this.prisma.treatment_plan_items.update({
      where: { id: existing.id },
      data: { status: 'cancelled' },
    });

    await this.auditService.log({
      tenantId,
      userId,
      action: 'treatment_plan_item.cancel',
      resourceType: 'treatment_plan_item',
      resourceId: item.id,
      result: 'success',
    });
    return item;
  }

  private async assertForeignKeys(tenantId: string, serviceId?: string, providerId?: string, appointmentId?: string) {
    if (serviceId) await this.assertService(tenantId, serviceId);
    if (providerId) await this.assertProvider(tenantId, providerId);
    if (appointmentId) await this.assertAppointment(tenantId, appointmentId);
  }

  private async assertService(tenantId: string, serviceId: string) {
    const service = await this.prisma.service.findFirst({ where: { id: serviceId, tenantId }, select: { id: true } });
    if (!service) throw new NotFoundException('Service not found in this practice');
  }

  private async assertProvider(tenantId: string, providerId: string) {
    const provider = await this.prisma.provider.findFirst({ where: { id: providerId, tenantId }, select: { id: true } });
    if (!provider) throw new NotFoundException('Provider not found in this practice');
  }

  private async assertAppointment(tenantId: string, appointmentId: string) {
    const appointment = await this.prisma.appointment.findFirst({ where: { id: appointmentId, tenantId }, select: { id: true } });
    if (!appointment) throw new NotFoundException('Appointment not found in this practice');
  }
}
