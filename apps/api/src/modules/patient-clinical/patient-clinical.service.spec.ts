import { PatientClinicalService } from './patient-clinical.service';
import { NotFoundException } from '@nestjs/common';

describe('PatientClinicalService', () => {
  let service: PatientClinicalService;

  const mockPrisma = {
    patient: { findFirst: jest.fn() },
    toothCondition: { findMany: jest.fn() },
    treatmentHistory: { findMany: jest.fn() },
    treatmentPlan: { findMany: jest.fn() },
    treatment_plan_items: { findMany: jest.fn() },
    appointment: { findMany: jest.fn() },
    clinicalNote: { findMany: jest.fn() },
    estimate: { findMany: jest.fn() },
    estimate_approvals: { findMany: jest.fn() },
    invoice: { findMany: jest.fn() },
    payment: { findMany: jest.fn() },
    refund: { findMany: jest.fn() },
    recall: { findMany: jest.fn() },
    message: { findMany: jest.fn() },
    patientDocument: { findMany: jest.fn() },
  };

  beforeEach(() => {
    jest.clearAllMocks();
    service = new PatientClinicalService(mockPrisma as never);
    mockPrisma.patient.findFirst.mockResolvedValue({ id: 'patient-1' });
  });

  const emptyAll = () => {
    for (const model of Object.values(mockPrisma)) {
      if (typeof model === 'object' && model !== null && 'findMany' in (model as Record<string, unknown>)) {
        (model as { findMany: jest.Mock }).findMany.mockResolvedValue([]);
      }
    }
  };

  it('404s when the patient belongs to another tenant (isolation)', async () => {
    mockPrisma.patient.findFirst.mockResolvedValue(null);

    await expect(service.getCurrentOdontogram('tenant-2', 'patient-1')).rejects.toThrow(NotFoundException);
    expect(mockPrisma.patient.findFirst).toHaveBeenCalledWith({ where: { id: 'patient-1', tenantId: 'tenant-2' }, select: { id: true } });
  });

  it('groups current odontogram findings and treatments per tooth', async () => {
    emptyAll();
    mockPrisma.toothCondition.findMany.mockResolvedValue([
      { id: 'f1', toothNumber: '16', condition: 'caries', status: 'planned', surfaces: ['occlusal'], createdAt: new Date() },
      { id: 'f2', toothNumber: '16', condition: 'filling', status: 'existing', surfaces: [], createdAt: new Date() },
      { id: 'f3', toothNumber: '26', condition: 'crown', status: 'watch', surfaces: [], createdAt: new Date() },
    ]);
    mockPrisma.treatmentHistory.findMany.mockResolvedValue([
      { id: 't1', toothNumber: '18', treatment: 'Extraction', date: new Date(), providerId: 'prov-1', cost: null, description: null },
    ]);

    const result = await service.getCurrentOdontogram('tenant-1', 'patient-1');

    expect(result.teeth['16'].findings).toHaveLength(2);
    expect(result.teeth['26'].findings).toHaveLength(1);
    expect(result.teeth['18'].treatments).toHaveLength(1);
  });

  it('reconstructs the odontogram at a past date, hiding later amendments and removals', async () => {
    emptyAll();
    const day = (n: number) => new Date(`2026-08-${String(n).padStart(2, '0')}T00:00:00Z`);
    mockPrisma.toothCondition.findMany.mockResolvedValue([
      // visible at Aug 10
      { id: 'keep', supersedesId: null, status: 'planned', createdAt: day(5), removedAt: null, resolvedAt: null, toothNumber: '16', condition: 'caries' },
      // amended on Aug 12 → hidden at Aug 15
      { id: 'old', supersedesId: null, status: 'superseded', createdAt: day(1), removedAt: null, resolvedAt: null, toothNumber: '17', condition: 'caries' },
      { id: 'newer', supersedesId: 'old', status: 'planned', createdAt: day(12), removedAt: null, resolvedAt: null, toothNumber: '17', condition: 'crown' },
      // removed on Aug 9 → hidden at Aug 15
      { id: 'gone', supersedesId: null, status: 'removed', createdAt: day(2), removedAt: day(9), resolvedAt: null, toothNumber: '18', condition: 'caries' },
      // resolved on Aug 11 → hidden at Aug 15 but visible at Aug 10
      { id: 'healed', supersedesId: null, status: 'resolved', createdAt: day(3), removedAt: null, resolvedAt: day(11), toothNumber: '19', condition: 'caries' },
    ]);
    mockPrisma.treatmentHistory.findMany.mockResolvedValue([]);

    const at15 = await service.getOdontogramAt('tenant-1', 'patient-1', day(15));
    expect(Object.keys(at15.teeth).sort()).toEqual(['16', '17']);

    const at10 = await service.getOdontogramAt('tenant-1', 'patient-1', day(10));
    expect(Object.keys(at10.teeth).sort()).toEqual(['16', '17', '19']);
  });

  it('composes the timeline from domain tables sorted newest-first with tenant scoping', async () => {
    emptyAll();
    const t0 = new Date('2026-08-20T09:00:00Z');
    const t1 = new Date('2026-08-22T09:00:00Z');
    const t2 = new Date('2026-08-24T09:00:00Z');

    mockPrisma.appointment.findMany.mockResolvedValue([
      {
        id: 'a1', startTime: t1, status: 'completed', notes: null,
        appointmentType: { name: 'Exam' }, providerId: 'prov-1', chairId: 'chair-1',
        statusEvents: [{ id: 'se1', toStatus: 'cancelled', createdAt: t0, note: 'no-show fee waived' }],
      },
    ]);
    mockPrisma.clinicalNote.findMany.mockResolvedValue([
      { id: 'n1', createdAt: t2, type: 'examination', signedAt: t2, assessment: 'OK', note: 'Routine check', providerId: 'prov-1', appointmentId: 'a1' },
    ]);
    mockPrisma.invoice.findMany.mockResolvedValue([
      { id: 'i1', issueDate: t0, invoiceNumber: 'INV-000001', total: 220, balance: 220, status: 'issued' },
    ]);

    const result = await service.getTimeline('tenant-1', 'patient-1', { skip: 0, take: 50 } as never);

    expect(result.total).toBe(4); // appointment + its cancellation event + clinical note + invoice
    expect(result.events[0].occurredAt.getTime()).toBeGreaterThanOrEqual(result.events[result.events.length - 1].occurredAt.getTime());
    expect(mockPrisma.appointment.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: expect.objectContaining({ tenantId: 'tenant-1', patientId: 'patient-1' }) }),
    );

    const types = result.events.map((e) => e.type);
    expect(types).toContain('clinical_note');
    expect(types).toContain('appointment_status');
    expect(types).toContain('invoice');
  });

  it('hides billing events when the caller lacks billing permissions', async () => {
    emptyAll();
    mockPrisma.invoice.findMany.mockResolvedValue([
      { id: 'i1', issueDate: new Date(), invoiceNumber: 'INV-1', total: 5, balance: 5, status: 'issued' },
    ]);

    const result = await service.getTimeline('tenant-1', 'patient-1', { skip: 0, take: 50 } as never, false);

    expect(result.events.map((e) => e.type)).not.toContain('invoice');
  });
});
