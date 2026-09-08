import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import { fdiToUniversal, universalToFdi } from '@danta/schemas';
import type { ClinicalTimelineEvent, ClinicalTimelineQuery, ClinicalTimelineEventType } from '@danta/schemas';
import type { Prisma } from '@prisma/client';

const ACTIVE_FINDING_STATUSES = ['planned', 'existing', 'watch'];

@Injectable()
export class PatientClinicalService {
  constructor(private readonly prisma: PrismaService) {}
  private async assertPatient(tenantId: string, patientId: string) {
    const patient = await this.prisma.patient.findFirst({ where: { id: patientId, tenantId }, select: { id: true } });
    if (!patient) throw new NotFoundException('Patient not found');
  }

  /** Current odontogram: active findings grouped per tooth plus completed treatment overlay. */
  async getCurrentOdontogram(tenantId: string, patientId: string) {
    await this.assertPatient(tenantId, patientId);
    const [conditions, treatments] = await Promise.all([
      this.prisma.toothCondition.findMany({
        where: { tenantId, dentalChart: { patientId }, status: { in: ACTIVE_FINDING_STATUSES } },
        orderBy: { createdAt: 'asc' },
      }),
      this.prisma.treatmentHistory.findMany({
        where: { tenantId, patientId },
        orderBy: { date: 'desc' },
        take: 200,
      }),
    ]);
    return {
      teeth: groupByTooth(conditions, treatments),
      generatedAt: new Date(),
    };
  }

  /**
   * Point-in-time odontogram reconstructed from authoritative records:
   * a finding is visible at `date` when it existed then and was not yet
   * resolved/removed/superseded at that moment.
   */
  async getOdontogramAt(tenantId: string, patientId: string, date: Date) {
    await this.assertPatient(tenantId, patientId);
    const [allConditions, treatments] = await Promise.all([
      this.prisma.toothCondition.findMany({
        where: { tenantId, dentalChart: { patientId }, createdAt: { lte: date } },
        orderBy: { createdAt: 'asc' },
      }),
      this.prisma.treatmentHistory.findMany({
        where: { tenantId, patientId, date: { lte: date } },
        orderBy: { date: 'desc' },
        take: 200,
      }),
    ]);

    // Amendments created by `date` hide their original rows.
    const supersededIds = new Set(
      allConditions.filter((c) => c.supersedesId && c.status !== 'removed' && c.createdAt <= date).map((c) => c.supersedesId as string),
    );
    const visible = allConditions.filter(
      (c) =>
        !supersededIds.has(c.id) &&
        c.status !== 'superseded' &&
        (!c.removedAt || c.removedAt > date) &&
        (!c.resolvedAt || c.resolvedAt > date),
    );

    return {
      asOf: date,
      teeth: groupByTooth(visible, treatments),
    };
  }

  /** Chronological clinical history for one tooth across findings, treatments and plan items.
   *  Accepts either FDI ("16") or Universal ("14") numbering since legacy rows mix both. */
  async getToothHistory(tenantId: string, patientId: string, toothNumber: string, skip = 0, take = 50) {
    await this.assertPatient(tenantId, patientId);
    const candidates = new Set<string>([toothNumber]);
    if (/^\d{1,2}$/.test(toothNumber)) {
      const n = Number(toothNumber);
      if (toothNumber.length === 2) {
        try { candidates.add(String(fdiToUniversal(n))); } catch { /* not FDI */ }
      } else {
        try { candidates.add(String(universalToFdi(n))); } catch { /* not universal */ }
      }
    }

    const [conditions, treatments, planItems] = await Promise.all([
      this.prisma.toothCondition.findMany({
        where: { tenantId, dentalChart: { patientId }, toothNumber: { in: [...candidates] } },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.treatmentHistory.findMany({
        where: { tenantId, patientId, toothNumber: { in: [...candidates] } },
        orderBy: { date: 'desc' },
        take: 500,
      }),
      this.prisma.treatment_plan_items.findMany({
        where: { tenantId, treatment_plans: { patientId }, toothNumber: { in: [...candidates] } },
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    const events: ClinicalTimelineEvent[] = [
      ...conditions.map((c) => ({
        id: `finding-${c.id}`,
        type: 'finding' as const,
        occurredAt: c.createdAt,
        resourceType: 'tooth_condition',
        resourceId: c.id,
        title: `${labelCondition(c.condition)} — ${c.status}`,
        detail: c.notes ?? undefined,
        metadata: { surfaces: c.surfaces, severity: c.severity, supersedesId: c.supersedesId, clinicalModule: c.clinicalModule ?? undefined },
      })),
      ...treatments
        .map((t) => ({
          id: `treatment-${t.id}`,
          type: 'treatment_completed' as const,
          occurredAt: t.date,
          resourceType: 'treatment_history',
          resourceId: t.id,
          title: `Treatment performed — ${t.treatment}`,
          detail: t.description ?? undefined,
          metadata: { providerId: t.providerId, cost: t.cost?.toString() },
        })),
      ...planItems.map((p) => ({
        id: `plan-item-${p.id}`,
        type: 'treatment_plan' as const,
        occurredAt: p.createdAt,
        resourceType: 'treatment_plan_item',
        resourceId: p.id,
        title: `Planned: ${p.description} (${p.status})`,
        detail: p.notes ?? undefined,
        metadata: { planId: p.planId, priority: p.priority, status: p.status },
      })),
    ].sort((a, b) => b.occurredAt.getTime() - a.occurredAt.getTime());

    return { events: events.slice(skip, skip + take), total: events.length };
  }

  /**
   * Unified patient timeline composed from authoritative domain tables at
   * query time — no duplicate timeline storage. Billing event types are only
   * returned when the caller passes `includeBilling`.
   */
  async getTimeline(tenantId: string, patientId: string, query: ClinicalTimelineQuery, includeBilling = true): Promise<{ events: ClinicalTimelineEvent[]; total: number }> {
    await this.assertPatient(tenantId, patientId);
    const wanted = new Set<ClinicalTimelineEventType>(query.types ?? []);
    const skip = query.skip ?? 0;
    const take = query.take ?? 50;
    const range: Prisma.DateTimeFilter = {};
    if (query.from) range.gte = query.from;
    if (query.to) range.lte = query.to;
    const window = query.from || query.to ? range : undefined;
    const perSource = Math.min(take * 3 + skip, 300);

    const jobs: Array<Promise<ClinicalTimelineEvent[]>> = [];
    const wants = (...types: ClinicalTimelineEventType[]) => types.every((t) => wanted.size === 0 || wanted.has(t));

    if (wants('appointment', 'appointment_status')) {
      jobs.push(this.prisma.appointment.findMany({
        where: { tenantId, patientId, ...(window ? { startTime: window } : {}) },
        orderBy: { startTime: 'desc' }, take: perSource,
        include: { appointmentType: true, appointment_status_events: { orderBy: { createdAt: 'asc' } } },
      }).then((rows) => rows.flatMap<ClinicalTimelineEvent>((a) => [
        {
          id: `appt-${a.id}`, type: 'appointment', occurredAt: a.startTime,
          resourceType: 'appointment', resourceId: a.id,
          title: `Appointment — ${a.appointmentType.name}`,
          detail: `${a.status}${a.notes ? ` · ${a.notes}` : ''}`,
          metadata: { providerId: a.providerId, chairId: a.chairId, status: a.status },
        },
        ...a.appointment_status_events
          .filter((e) => ['cancelled', 'no_show'].includes(e.toStatus))
          .map((e) => ({
            id: `appt-status-${e.id}`, type: 'appointment_status' as const, occurredAt: e.createdAt,
            resourceType: 'appointment_status_event', resourceId: e.id,
            title: `Appointment ${e.toStatus.replace('_', ' ')}`,
            detail: e.note ?? undefined,
            metadata: { appointmentId: a.id },
          })),
      ])));
    }

    if (wants('clinical_note')) {
      jobs.push(this.prisma.clinicalNote.findMany({
        where: { tenantId, patientId, ...(window ? { createdAt: window } : {}), ...(query.providerId ? { providerId: query.providerId } : {}) },
        orderBy: { createdAt: 'desc' }, take: perSource,
      }).then((rows) => rows.map((n) => ({
        id: `note-${n.id}`, type: 'clinical_note' as const, occurredAt: n.createdAt,
        resourceType: 'clinical_note', resourceId: n.id,
        title: `Clinical note${n.signedAt ? ' (signed)' : ''} — ${n.type.replace('_', ' ')}`,
        detail: n.assessment ?? n.note.slice(0, 140),
        metadata: { providerId: n.providerId, appointmentId: n.appointmentId },
      }))));
    }

    if (wants('finding')) {
      jobs.push(this.prisma.toothCondition.findMany({
        where: {
          tenantId, dentalChart: { patientId },
          ...(window ? { createdAt: window } : {}),
          ...(query.toothNumber ? { toothNumber: query.toothNumber } : {}),
        },
        orderBy: { createdAt: 'desc' }, take: perSource,
      }).then((rows) => rows.map((c) => ({
        id: `finding-${c.id}`, type: 'finding' as const, occurredAt: c.createdAt,
        resourceType: 'tooth_condition', resourceId: c.id,
        title: `Tooth ${c.toothNumber} — ${labelCondition(c.condition)} (${c.status})`,
        detail: c.notes ?? undefined,
        metadata: { surfaces: c.surfaces, severity: c.severity, supersedesId: c.supersedesId, clinicalModule: c.clinicalModule ?? undefined },
      }))));
    }

    if (wants('treatment_completed')) {
      jobs.push(this.prisma.treatmentHistory.findMany({
        where: { tenantId, patientId, ...(window ? { date: window } : {}), ...(query.providerId ? { providerId: query.providerId } : {}) },
        orderBy: { date: 'desc' }, take: perSource,
      }).then((rows) => rows.map((t) => ({
        id: `treatment-${t.id}`, type: 'treatment_completed' as const, occurredAt: t.date,
        resourceType: 'treatment_history', resourceId: t.id,
        title: `Treatment performed — ${t.treatment}`,
        detail: t.description ?? undefined,
        metadata: { providerId: t.providerId, appointmentId: t.appointmentId },
      }))));
    }

    if (wants('treatment_plan')) {
      jobs.push(this.prisma.treatmentPlan.findMany({
        where: { tenantId, patientId, ...(window ? { createdAt: window } : {}) },
        orderBy: { createdAt: 'desc' }, take: perSource,
      }).then((rows) => rows.flatMap<ClinicalTimelineEvent>((p) => [
        {
          id: `plan-${p.id}`, type: 'treatment_plan', occurredAt: p.createdAt,
          resourceType: 'treatment_plan', resourceId: p.id,
          title: `Treatment plan: ${p.name} (${p.status})`,
          metadata: { status: p.status, version: p.version },
        },
        ...(p.approvedAt ? [{
          id: `plan-approved-${p.id}`, type: 'treatment_plan' as const, occurredAt: p.approvedAt,
          resourceType: 'treatment_plan', resourceId: p.id,
          title: `Treatment plan approved: ${p.name}`,
        }] : []),
      ])));
    }

    if (wants('estimate')) {
      jobs.push(this.prisma.estimate.findMany({
        where: { tenantId, patientId, ...(window ? { createdAt: window } : {}) },
        orderBy: { createdAt: 'desc' }, take: perSource,
      }).then((rows) => rows.map((e) => ({
        id: `estimate-${e.id}`, type: 'estimate' as const, occurredAt: e.createdAt,
        resourceType: 'estimate', resourceId: e.id,
        title: `Estimate ${e.estimateNumber} — $${e.total.toString()} (${e.status})`,
        metadata: { status: e.status, version: e.version },
      }))));
    }

    if (wants('estimate_approval')) {
      jobs.push(this.prisma.estimate_approvals.findMany({
        where: { tenantId, Estimate: { patientId }, ...(window ? { signedAt: window } : {}) },
        orderBy: { signedAt: 'desc' }, take: perSource,
      }).then((rows) => rows.map((a) => ({
        id: `approval-${a.id}`, type: 'estimate_approval' as const, occurredAt: a.signedAt,
        resourceType: 'estimate_approval', resourceId: a.id,
        title: `Estimate ${a.decision.replace('_', ' ')} — signed by ${a.signerName}`,
        metadata: { method: a.method, estimateId: a.estimateId },
      }))));
    }

    if (includeBilling && wants('invoice')) {
      jobs.push(this.prisma.invoice.findMany({
        where: { tenantId, patientId, ...(window ? { issueDate: window } : {}) },
        orderBy: { issueDate: 'desc' }, take: perSource,
      }).then((rows) => rows.map((i) => ({
        id: `invoice-${i.id}`, type: 'invoice' as const, occurredAt: i.issueDate,
        resourceType: 'invoice', resourceId: i.id,
        title: `Invoice ${i.invoiceNumber} — $${i.total.toString()} (${i.status})`,
        metadata: { balance: i.balance.toString(), status: i.status },
      }))));
    }

    if (includeBilling && wants('payment')) {
      jobs.push(this.prisma.payment.findMany({
        where: { tenantId, patientId, ...(window ? { receivedAt: window } : {}) },
        orderBy: { receivedAt: 'desc' }, take: perSource,
      }).then((rows) => rows.map((p) => ({
        id: `payment-${p.id}`, type: 'payment' as const, occurredAt: p.receivedAt,
        resourceType: 'payment', resourceId: p.id,
        title: `Payment $${p.amount.toString()} (${p.method.replace('_', ' ')})`,
        metadata: { status: p.status },
      }))));
    }

    if (includeBilling && wants('refund')) {
      jobs.push(this.prisma.refund.findMany({
        where: { tenantId, invoice: { patientId }, ...(window ? { processedAt: window } : {}) },
        orderBy: { createdAt: 'desc' }, take: perSource,
      }).then((rows) => rows.map((r) => ({
        id: `refund-${r.id}`, type: 'refund' as const, occurredAt: r.processedAt ?? r.createdAt,
        resourceType: 'refund', resourceId: r.id,
        title: `Refund $${r.amount.toString()} (${r.status})`,
        detail: r.reason ?? undefined,
      }))));
    }

    if (wants('recall')) {
      jobs.push(this.prisma.recall.findMany({
        where: { tenantId, patientId, ...(window ? { dueDate: window } : {}) },
        orderBy: { dueDate: 'desc' }, take: perSource,
      }).then((rows) => rows.map((r) => ({
        id: `recall-${r.id}`, type: 'recall' as const, occurredAt: r.dueDate,
        resourceType: 'recall', resourceId: r.id,
        title: `Recall due — ${r.type.replace('_', ' ')} (${r.status})`,
        metadata: { contactCount: r.contactCount },
      }))));
    }

    if (wants('communication')) {
      jobs.push(this.prisma.message.findMany({
        where: { tenantId, patientId, ...(window ? { createdAt: window } : {}) },
        orderBy: { createdAt: 'desc' }, take: perSource,
      }).then((rows) => rows.map((m) => ({
        id: `message-${m.id}`, type: 'communication' as const, occurredAt: m.createdAt,
        resourceType: 'message', resourceId: m.id,
        title: `${m.channel.toUpperCase()} message (${m.status})`,
        detail: m.subject ?? m.body?.slice(0, 120),
      }))));
    }

    if (wants('document')) {
      jobs.push(this.prisma.patientDocument.findMany({
        where: { tenantId, patientId, ...(window ? { createdAt: window } : {}) },
        orderBy: { createdAt: 'desc' }, take: perSource,
      }).then((rows) => rows.map((d) => ({
        id: `document-${d.id}`, type: 'document' as const, occurredAt: d.createdAt,
        resourceType: 'patient_document', resourceId: d.id,
        title: `Document uploaded — ${d.name}`,
      }))));
    }

    const settled = await Promise.all(jobs);
    let merged = settled.flat();

    if (wanted.size > 0) merged = merged.filter((e) => wanted.has(e.type));
    merged.sort((a, b) => b.occurredAt.getTime() - a.occurredAt.getTime());

    return { events: merged.slice(skip, skip + take), total: merged.length };
  }
}

function labelCondition(condition: string): string {
  return condition.replaceAll('_', ' ').replace(/\b\w/g, (ch) => ch.toUpperCase());
}

function groupByTooth(conditions: Array<{ toothNumber: string | null; [k: string]: unknown }>, treatments: Array<{ [k: string]: unknown }>) {
  const teeth: Record<string, { findings: unknown[]; treatments: unknown[] }> = {};
  for (const condition of conditions) {
    if (!condition.toothNumber) continue;
    const entry = (teeth[condition.toothNumber] ??= { findings: [], treatments: [] });
    entry.findings.push(condition);
  }
  for (const treatment of treatments) {
    const tooth = (treatment as { toothNumber?: string | null }).toothNumber ?? 'general';
    const entry = (teeth[tooth] ??= { findings: [], treatments: [] });
    entry.treatments.push(treatment);
  }
  return teeth;
}
