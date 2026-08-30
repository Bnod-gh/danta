import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import { AuditService } from '../audit/audit.service';
import { PerformTreatments } from '@danta/schemas';

const PERFORMABLE_APPOINTMENT_STATUSES = ['in_progress', 'completed'];
const PERFORMABLE_ITEM_STATUSES = ['accepted', 'scheduled', 'in_progress', 'partially_completed'];
const ACTIVE_FINDING_STATUSES = ['planned', 'existing', 'watch'];
const TREATMENT_FOLLOWUP_DEFAULT_DAYS = 14;

function addDays(date: Date, days: number): Date {
  return new Date(date.getTime() + days * 24 * 60 * 60 * 1000);
}

@Injectable()
export class TreatmentExecutionService {
  constructor(private readonly prisma: PrismaService, private readonly auditService: AuditService) {}

  /**
   * Core clinical→financial workflow (spec §§18-20): records performed
   * treatments for an appointment, completes linked plan items, optionally
   * resolves charted findings, ensures a treatment follow-up recall exists,
   * and can generate the invoice — all in one transaction.
   */
  async performForAppointment(tenantId: string, userId: string, appointmentId: string, data: PerformTreatments) {
    const appointment = await this.prisma.appointment.findFirst({
      where: { id: appointmentId, tenantId },
      select: { id: true, patientId: true, providerId: true, status: true },
    });
    if (!appointment) throw new NotFoundException('Appointment not found');
    if (!PERFORMABLE_APPOINTMENT_STATUSES.includes(appointment.status)) {
      throw new ConflictException('Treatments can only be recorded on in-progress or completed appointments');
    }

    const result = await this.prisma.$transaction(async (tx) => {
      const treatments: Array<Record<string, unknown>> = [];
      const completedItemIds: string[] = [];
      const invoiceLines: Array<{ description: string; cdtCode?: string; serviceId?: string; unitPrice: number }> = [];
      let resolvedFindings = 0;
      let recall: Record<string, unknown> | undefined;

      for (const item of data.items) {
        if (!item.planItemId && !item.treatment?.trim()) {
          throw new BadRequestException('Each treatment needs a linked plan item or a treatment name');
        }

        let toothNumber = item.toothNumber ?? null;
        let surfaces: string[] = item.surfaces ?? [];
        let treatmentName = item.treatment?.trim() ?? '';
        let description = item.description ?? null;
        let cost = item.cost ?? null;
        let cdtCode: string | undefined;
        let serviceId: string | undefined;
        let planItemId: string | undefined;

        if (item.planItemId) {
          const planItem = await tx.treatment_plan_items.findFirst({
            where: { id: item.planItemId, tenantId, treatment_plans: { patientId: appointment.patientId } },
            include: { treatment_plans: { select: { patientId: true } } },
          });
          if (!planItem) throw new NotFoundException('A selected treatment plan item was not found for this patient');
          if (!PERFORMABLE_ITEM_STATUSES.includes(planItem.status)) {
            throw new ConflictException(`Plan item "${planItem.description}" is ${planItem.status} and cannot be performed`);
          }
          planItemId = planItem.id;
          treatmentName = treatmentName || planItem.treatmentCode || planItem.description;
          description = description ?? planItem.notes ?? null;
          toothNumber = toothNumber ?? planItem.toothNumber ?? null;
          surfaces = surfaces.length ? surfaces : planItem.surfaces;
          cost = cost ?? Number(planItem.unitPrice) * planItem.quantity - Number(planItem.discount);
          cdtCode = planItem.treatmentCode ?? undefined;
          serviceId = planItem.serviceId ?? undefined;
        }

        const record = await tx.treatmentHistory.create({
          data: {
            tenantId,
            patientId: appointment.patientId,
            appointmentId,
            providerId: appointment.providerId,
            planItemId,
            toothNumber,
            surfaces,
            treatment: treatmentName,
            description,
            cost,
            date: new Date(),
            status: 'completed',
          },
        });
        treatments.push(record);

        if (planItemId) {
          await tx.treatment_plan_items.update({
            where: { id: planItemId },
            data: { status: 'completed', completedAt: new Date() },
          });
          await tx.appointment_treatments.upsert({
            where: { tenantId_appointmentId_planItemId: { tenantId, appointmentId, planItemId } },
            create: { tenantId, appointmentId, planItemId, performed: true },
            update: { performed: true },
          });
          completedItemIds.push(planItemId);
        }

        if (item.resolveFindingIds?.length) {
          const updated = await tx.toothCondition.updateMany({
            where: {
              id: { in: item.resolveFindingIds },
              tenantId,
              dentalChart: { patientId: appointment.patientId },
              status: { in: ACTIVE_FINDING_STATUSES },
            },
            data: { status: 'resolved', resolvedAt: new Date(), resolvedByUserId: userId },
          });
          resolvedFindings += updated.count;
        }

        if (data.createInvoice && cost !== null) {
          invoiceLines.push({ description: treatmentName, cdtCode, serviceId, unitPrice: cost });
        }
      }

      // Treatment follow-up recall: one active recall per patient of this type.
      const hasFollowupConfig = await tx.recall_type_configs.findFirst({
        where: { tenantId, type: 'treatment_followup', isActive: true },
        select: { intervalDays: true },
      });
      const intervalDays = hasFollowupConfig?.intervalDays ?? TREATMENT_FOLLOWUP_DEFAULT_DAYS;
      const existingRecall = await tx.recall.findFirst({
        where: { tenantId, patientId: appointment.patientId, type: 'treatment_followup', status: { in: ['pending', 'due', 'overdue', 'booked'] as never } },
        select: { id: true, dueDate: true },
      });
      if (!existingRecall) {
        recall = await tx.recall.create({
          data: {
            tenantId,
            patientId: appointment.patientId,
            type: 'treatment_followup',
            status: 'due',
            dueDate: addDays(new Date(), intervalDays),
          },
        });
      }

      let invoice: Record<string, unknown> | undefined;
      if (data.createInvoice && invoiceLines.length > 0) {
        const count = await tx.invoice.count({ where: { tenantId } });
        const subtotal = invoiceLines.reduce((sum, line) => sum + line.unitPrice, 0);
        const tax = invoiceLines.reduce((sum, line) => sum + line.unitPrice * (data.taxRate / 100), 0);
        const total = subtotal + tax;
        invoice = await tx.invoice.create({
          data: {
            tenantId,
            patientId: appointment.patientId,
            invoiceNumber: `INV-${String(count + 1).padStart(6, '0')}`,
            issueDate: new Date(),
            dueDate: addDays(new Date(), 14),
            status: 'issued',
            subtotal,
            tax,
            total,
            balance: total,
            patientAmount: total,
            items: {
              create: invoiceLines.map((line) => ({
                tenantId,
                serviceId: line.serviceId,
                description: line.description.slice(0, 255),
                cdtCode: line.cdtCode,
                quantity: 1,
                unitPrice: line.unitPrice,
                taxRate: data.taxRate,
                total: line.unitPrice,
              })),
            },
          },
          include: { items: true },
        });
      } else if (data.createInvoice) {
        throw new BadRequestException('Add at least one priced treatment before generating an invoice');
      }

      return { treatments, completedItemIds, resolvedFindings, recall, invoice };
    });

    await this.auditService.log({
      tenantId,
      userId,
      action: 'treatment_execution.perform',
      resourceType: 'appointment',
      resourceId: appointmentId,
      metadata: {
        treatmentsRecorded: result.treatments.length,
        completedItemIds: result.completedItemIds,
        resolvedFindings: result.resolvedFindings,
        recallCreated: Boolean(result.recall),
        invoiceCreated: Boolean(result.invoice),
      },
      result: 'success',
    });

    return result;
  }
}
