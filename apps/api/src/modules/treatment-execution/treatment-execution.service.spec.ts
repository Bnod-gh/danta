import { TreatmentExecutionService } from './treatment-execution.service';
import { AuditService } from '../audit/audit.service';
import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';

describe('TreatmentExecutionService.performForAppointment', () => {
  let service: TreatmentExecutionService;

  const tx = {
    appointment: { findFirst: jest.fn() },
    treatment_plan_items: { findFirst: jest.fn(), update: jest.fn() },
    treatmentHistory: { create: jest.fn() },
    appointment_treatments: { upsert: jest.fn() },
    toothCondition: { updateMany: jest.fn() },
    recall_type_configs: { findFirst: jest.fn() },
    recall: { findFirst: jest.fn(), create: jest.fn() },
    invoice: { count: jest.fn(), create: jest.fn() },
  };

  const mockPrisma = {
    appointment: { findFirst: jest.fn() },
    $transaction: jest.fn((fn: (t: typeof tx) => Promise<unknown>) => fn(tx)),
  };
  const audit = { log: jest.fn().mockResolvedValue(undefined) } as unknown as AuditService;

  const appointment = { id: 'appt-1', tenantId: 'tenant-1', patientId: 'patient-1', providerId: 'prov-1', status: 'completed' };

  beforeEach(() => {
    jest.clearAllMocks();
    service = new TreatmentExecutionService(mockPrisma as never, audit);
    mockPrisma.appointment.findFirst.mockResolvedValue({ ...appointment });
    tx.treatmentHistory.create.mockImplementation(async ({ data }) => ({ id: `th-${tx.treatmentHistory.create.mock.calls.length}`, ...data }));
    tx.treatment_plan_items.update.mockResolvedValue({});
    tx.appointment_treatments.upsert.mockResolvedValue({});
    tx.toothCondition.updateMany.mockResolvedValue({ count: 2 });
    tx.recall_type_configs.findFirst.mockResolvedValue({ intervalDays: 14 });
    tx.recall.findFirst.mockResolvedValue(null);
    tx.recall.create.mockImplementation(async ({ data }) => ({ id: 'recall-1', ...data }));
    tx.invoice.count.mockResolvedValue(3);
    tx.invoice.create.mockImplementation(async ({ data }) => ({ id: 'inv-1', ...data, items: data.items?.create ?? [] }));
  });

  const planItem = {
    id: 'pi-1',
    tenantId: 'tenant-1',
    status: 'accepted',
    description: 'Composite restoration',
    treatmentCode: 'D2392',
    toothNumber: '16',
    surfaces: ['occlusal'],
    quantity: 1,
    unitPrice: 220,
    discount: 0,
    serviceId: null,
    notes: null,
    plan: { patientId: 'patient-1' },
  };

  it('records the treatment, completes the plan item and links the visit atomically', async () => {
    tx.treatment_plan_items.findFirst.mockResolvedValue({ ...planItem });

    const result = await service.performForAppointment('tenant-1', 'user-1', 'appt-1', {
      items: [{ planItemId: 'pi-1' }],
      createInvoice: false,
      taxRate: 0,
    });

    expect(result.treatments).toHaveLength(1);
    expect(result.completedItemIds).toEqual(['pi-1']);
    expect(tx.treatment_plan_items.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ status: 'completed', completedAt: expect.any(Date) }) }),
    );
    expect(tx.appointment_treatments.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { tenantId_appointmentId_planItemId: { tenantId: 'tenant-1', appointmentId: 'appt-1', planItemId: 'pi-1' } },
        update: { performed: true },
      }),
    );
    expect(audit.log).toHaveBeenCalledWith(expect.objectContaining({ action: 'treatment_execution.perform' }));
  });

  it('creates a due treatment follow-up recall when none is active', async () => {
    await service.performForAppointment('tenant-1', 'user-1', 'appt-1', {
      items: [{ treatment: 'Fluoride application', cost: 80 }],
      createInvoice: false,
      taxRate: 0,
    });

    expect(tx.recall.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ type: 'treatment_followup', status: 'due' }),
      }),
    );
  });

  it('does not duplicate an active follow-up recall (idempotent)', async () => {
    tx.recall.findFirst.mockResolvedValue({ id: 'existing', dueDate: new Date() });

    await service.performForAppointment('tenant-1', 'user-1', 'appt-1', {
      items: [{ treatment: 'Fluoride application', cost: 80 }],
      createInvoice: false,
      taxRate: 0,
    });

    expect(tx.recall.create).not.toHaveBeenCalled();
  });

  it('resolves requested charted findings scoped to the appointment patient', async () => {
    await service.performForAppointment('tenant-1', 'user-1', 'appt-1', {
      items: [{
        treatment: 'Composite restoration',
        toothNumber: '16',
        cost: 220,
        resolveFindingIds: ['f1', 'f2'],
      }],
      createInvoice: false,
      taxRate: 0,
    });

    expect(tx.toothCondition.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          dentalChart: { patientId: 'patient-1' },
          status: { in: ['planned', 'existing', 'watch'] },
        }),
        data: expect.objectContaining({ status: 'resolved', resolvedByUserId: 'user-1' }),
      }),
    );
  });

  it('generates an AUD invoice with GST when requested', async () => {
    const result = await service.performForAppointment('tenant-1', 'user-1', 'appt-1', {
      items: [{ planItemId: 'pi-1' }, { treatment: 'Fluoride', cost: 80 }],
      createInvoice: true,
      taxRate: 10,
    });

    const invoiceData = tx.invoice.create.mock.calls[0][0].data;
    // subtotal 220 + 80; GST 10% on both
    expect(invoiceData.subtotal).toBe(300);
    expect(invoiceData.tax).toBeCloseTo(30);
    expect(invoiceData.total).toBe(330);
    expect(invoiceData.balance).toBe(330);
    expect(invoiceData.invoiceNumber).toBe('INV-000004');
    expect(invoiceData.items.create).toHaveLength(2);
    expect(result.invoice).toBeDefined();
  });

  it('rejects invoice generation with no priced lines', async () => {
    await expect(
      service.performForAppointment('tenant-1', 'user-1', 'appt-1', {
        items: [{ treatment: 'Observation only' }],
        createInvoice: true,
        taxRate: 0,
      }),
    ).rejects.toThrow(BadRequestException);
  });

  it('refuses appointments that are not in progress or completed', async () => {
    mockPrisma.appointment.findFirst.mockResolvedValue({ ...appointment, status: 'scheduled' });

    await expect(
      service.performForAppointment('tenant-1', 'user-1', 'appt-1', { items: [{ treatment: 'X', cost: 5 }], createInvoice: false, taxRate: 0 }),
    ).rejects.toThrow(ConflictException);
  });

  it('404s cross-tenant appointments (isolation)', async () => {
    mockPrisma.appointment.findFirst.mockResolvedValue(null);

    await expect(
      service.performForAppointment('tenant-2', 'user-1', 'appt-1', { items: [{ treatment: 'X', cost: 5 }], createInvoice: false, taxRate: 0 }),
    ).rejects.toThrow(NotFoundException);
  });

  it('rejects plan items of another patient or non-performable status', async () => {
    tx.treatment_plan_items.findFirst.mockResolvedValue({ ...planItem, status: 'completed' });

    await expect(
      service.performForAppointment('tenant-1', 'user-1', 'appt-1', { items: [{ planItemId: 'pi-1' }], createInvoice: false, taxRate: 0 }),
    ).rejects.toThrow(ConflictException);
  });
});
