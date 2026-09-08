import { EstimatesService } from './estimates.service';
import { AuditService } from '../audit/audit.service';
import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';

describe('EstimatesService', () => {
  let service: EstimatesService;

  const txMock = {
    estimate: { create: jest.fn(), update: jest.fn() },
    estimate_approvals: { create: jest.fn() },
    treatment_plan_items: { updateMany: jest.fn() },
  };

  const mockPrisma = {
    patient: { findFirst: jest.fn() },
    provider: { findFirst: jest.fn() },
    treatmentPlan: { findFirst: jest.fn() },
    estimate: { count: jest.fn(), findFirst: jest.fn(), update: jest.fn() },
    $transaction: jest.fn((fn: (tx: typeof txMock) => Promise<unknown>) => fn(txMock)),
  };
  const audit = { log: jest.fn().mockResolvedValue(undefined) } as unknown as AuditService;

  const estimateRow = {
    id: 'est-1',
    tenantId: 'tenant-1',
    patientId: 'patient-1',
    status: 'presented',
    validUntil: null,
    estimate_items: [{ id: 'ei-1', planItemId: 'plan-item-1' }],
    estimate_approvals: [],
  };

  beforeEach(() => {
    jest.clearAllMocks();
    service = new EstimatesService(mockPrisma as never, audit);
    mockPrisma.patient.findFirst.mockResolvedValue({ id: 'patient-1' });
    mockPrisma.estimate.count.mockResolvedValue(4);
    mockPrisma.estimate.findFirst.mockResolvedValue({ ...estimateRow });
    txMock.estimate.create.mockImplementation(async ({ data }: { data: Record<string, unknown> }) => ({
      id: 'est-new',
      ...data,
      items: (data as { items?: { create?: unknown[] } }).items?.create ?? [],
    }));
  });

  it('creates estimates with AUD totals, discounts and GST-style tax', async () => {
    const created = await service.create('tenant-1', 'user-1', {
      patientId: 'patient-1',
      items: [{ description: 'Crown', quantity: 1, unitPrice: 1250, discount: 50, taxRate: 10 }],
    });

    expect(created.subtotal).toBe(1250);
    expect(created.discount).toBe(50);
    // (1250 - 50) * 10% GST
    expect(created.tax).toBe(120);
    expect(created.total).toBe(1320);
    expect(created.estimateNumber).toBe('EST-000005');
    expect(audit.log).toHaveBeenCalledWith(expect.objectContaining({ action: 'estimate.create' }));
  });

  it('builds an estimate from planned plan items only', async () => {
    mockPrisma.treatmentPlan.findFirst.mockResolvedValue({
      id: 'plan-1',
      tenantId: 'tenant-1',
      patientId: 'patient-1',
      providerId: null,
      treatment_plan_items: [
        { id: 'pi-1', serviceId: null, treatmentCode: 'D2392', description: 'Composite', toothNumber: '16', surfaces: ['occlusal'], quantity: 1, unitPrice: 220, discount: 0, taxRate: 0, status: 'planned' },
        { id: 'pi-2', serviceId: null, treatmentCode: 'D2740', description: 'Crown', toothNumber: '17', surfaces: [], quantity: 1, unitPrice: 1250, discount: 0, taxRate: 0, status: 'accepted' },
        { id: 'pi-3', serviceId: null, treatmentCode: 'D7140', description: 'Extraction', toothNumber: '18', surfaces: [], quantity: 1, unitPrice: 250, discount: 0, taxRate: 0, status: 'completed' },
      ],
    });

    await service.createFromPlan('tenant-1', 'user-1', { treatmentPlanId: 'plan-1' });
    const createCall = txMock.estimate.create.mock.calls[0][0];
    const createdItems = createCall.data.estimate_items.create;
    expect(createdItems).toHaveLength(2); // completed item excluded
  });

  it('rejects plan estimates when nothing is plannable', async () => {
    mockPrisma.treatmentPlan.findFirst.mockResolvedValue({ id: 'plan-1', tenantId: 'tenant-1', patientId: 'patient-1', providerId: null, treatment_plan_items: [] });

    await expect(service.createFromPlan('tenant-1', 'user-1', { treatmentPlanId: 'plan-1' })).rejects.toThrow(BadRequestException);
  });

  it('only presents draft estimates', async () => {
    mockPrisma.estimate.findFirst.mockResolvedValue({ ...estimateRow, status: 'approved' });
    await expect(service.present('tenant-1', 'user-1', 'est-1')).rejects.toThrow(ConflictException);
  });

  it('records an immutable patient approval and accepts linked plan items atomically', async () => {
    await service.decide(
      'tenant-1',
      'staff-1',
      'est-1',
      { decision: 'approved', signerName: 'John Smith', method: 'in_person' },
      { ip: '203.0.113.9', userAgent: 'Mozilla/5.0' },
    );

    expect(txMock.estimate_approvals.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ decision: 'approved', signerName: 'John Smith', ipAddress: '203.0.113.9' }),
      }),
    );
    expect(txMock.treatment_plan_items.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({ data: { status: 'accepted' } }),
    );
    expect(txMock.estimate.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ status: 'approved' }) }),
    );
    expect(audit.log).toHaveBeenCalledWith(expect.objectContaining({ action: 'estimate.approved' }));
  });

  it('refuses decisions on already decided estimates', async () => {
    mockPrisma.estimate.findFirst.mockResolvedValue({ ...estimateRow, status: 'rejected' });

    await expect(
      service.decide('tenant-1', 'staff-1', 'est-1', { decision: 'approved', signerName: 'X', method: 'verbal' }, {}),
    ).rejects.toThrow(ConflictException);
  });

  it('refuses decisions on expired estimates', async () => {
    mockPrisma.estimate.findFirst.mockResolvedValue({
      ...estimateRow,
      validUntil: new Date(Date.now() - 86_400_000),
    });

    await expect(
      service.decide('tenant-1', 'staff-1', 'est-1', { decision: 'approved', signerName: 'X', method: 'verbal' }, {}),
    ).rejects.toThrow(ConflictException);
  });

  it('scopes lookups by tenant (isolation)', async () => {
    mockPrisma.estimate.findFirst.mockResolvedValue(null);

    await expect(service.findOne('tenant-2', 'est-1')).rejects.toThrow(NotFoundException);
    expect(mockPrisma.estimate.findFirst).toHaveBeenCalledWith(expect.objectContaining({ where: expect.objectContaining({ tenantId: 'tenant-2' }) }));
  });

  it('throws for patients outside the tenant', async () => {
    mockPrisma.patient.findFirst.mockResolvedValue(null);

    await expect(
      service.create('tenant-1', 'user-1', { patientId: 'other-tenant-patient', items: [{ description: 'X', quantity: 1, unitPrice: 5, discount: 0, taxRate: 0 }] }),
    ).rejects.toThrow(NotFoundException);
  });
});
