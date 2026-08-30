import { TreatmentPlanItemsService } from './treatment-plan-items.service';
import { AuditService } from '../audit/audit.service';
import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';

describe('TreatmentPlanItemsService', () => {
  let service: TreatmentPlanItemsService;

  const mockPrisma = {
    treatmentPlan: { findFirst: jest.fn() },
    treatment_plan_items: { findFirst: jest.fn(), create: jest.fn(), update: jest.fn(), updateMany: jest.fn() },
    patient: { findFirst: jest.fn() },
    service: { findFirst: jest.fn() },
    provider: { findFirst: jest.fn() },
    appointment: { findFirst: jest.fn() },
  };
  const audit = { log: jest.fn().mockResolvedValue(undefined) } as unknown as AuditService;

  const planItem = {
    id: 'item-1',
    tenantId: 'tenant-1',
    planId: 'plan-1',
    description: 'Composite restoration',
    toothNumber: '16',
    surfaces: ['occlusal'],
    quantity: 1,
    unitPrice: 220,
    discount: 0,
    taxRate: 0,
    status: 'planned',
    priority: 'routine',
    appointmentId: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    service = new TreatmentPlanItemsService(mockPrisma as never, audit);
    mockPrisma.treatmentPlan.findFirst.mockResolvedValue({ id: 'plan-1', tenantId: 'tenant-1', status: 'draft', patientId: 'p1' });
    mockPrisma.patient.findFirst.mockResolvedValue({ id: 'p1' });
    mockPrisma.treatment_plan_items.findFirst.mockResolvedValue({ ...planItem });
    mockPrisma.treatment_plan_items.create.mockImplementation(async ({ data }: { data: Record<string, unknown> }) => ({ id: 'new-item', ...data }));
    mockPrisma.treatment_plan_items.update.mockImplementation(async ({ data }: { data: Record<string, unknown> }) => ({ ...planItem, ...data }));
  });

  it('creates items only on editable plans', async () => {
    const item = await service.create('tenant-1', 'user-1', {
      planId: 'plan-1',
      description: 'Composite restoration',
      toothNumber: '16',
      quantity: 1,
      unitPrice: 220,
      discount: 0,
      taxRate: 0,
      priority: 'routine',
    });
    expect(item.status).toBe('planned');
    expect(audit.log).toHaveBeenCalledWith(expect.objectContaining({ action: 'treatment_plan_item.create' }));
  });

  it('blocks edits on accepted plans to protect approved versions', async () => {
    mockPrisma.treatmentPlan.findFirst.mockResolvedValue({ id: 'plan-1', tenantId: 'tenant-1', status: 'approved', patientId: 'p1' });

    await expect(
      service.create('tenant-1', 'user-1', { planId: 'plan-1', description: 'X', quantity: 1, unitPrice: 10, discount: 0, taxRate: 0, priority: 'routine' }),
    ).rejects.toThrow(ConflictException);
  });

  it('rejects stale concurrency tokens on update', async () => {
    await expect(
      service.update('tenant-1', 'user-1', 'item-1', {
        unitPrice: 300,
        expectedUpdatedAt: new Date('2020-01-01T00:00:00Z').toISOString(),
      }),
    ).rejects.toThrow(ConflictException);
  });

  it('enforces legal status transitions', async () => {
    await expect(
      service.transition('tenant-1', 'user-1', 'item-1', { status: 'completed' }),
    ).rejects.toThrow(ConflictException);
  });

  it('requires an appointment before an item can be scheduled', async () => {
    await expect(
      service.transition('tenant-1', 'user-1', 'item-1', { status: 'scheduled' }),
    ).rejects.toThrow(BadRequestException);
  });

  it('schedules with a linked appointment from the same tenant', async () => {
    mockPrisma.appointment.findFirst.mockResolvedValue({ id: 'appt-1' });

    const item = await service.transition('tenant-1', 'user-1', 'item-1', { status: 'scheduled', appointmentId: 'appt-1' });
    expect(item.status).toBe('scheduled');
  });

  it('completes an in-progress item and stamps completedAt', async () => {
    mockPrisma.treatment_plan_items.findFirst.mockResolvedValue({ ...planItem, status: 'in_progress' });

    const item = await service.transition('tenant-1', 'user-1', 'item-1', { status: 'completed' });
    expect(item.completedAt).toBeDefined();
    expect(audit.log).toHaveBeenCalledWith(expect.objectContaining({ action: 'treatment_plan_item.transition' }));
  });

  it('cancels instead of hard-deleting', async () => {
    const result = await service.cancel('tenant-1', 'user-1', 'item-1');
    expect(result.status).toBe('cancelled');
    expect(mockPrisma.treatment_plan_items.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ status: 'cancelled' }) }),
    );
  });

  it('cannot complete twice', async () => {
    mockPrisma.treatment_plan_items.findFirst.mockResolvedValue({ ...planItem, status: 'completed' });

    await expect(service.cancel('tenant-1', 'user-1', 'item-1')).rejects.toThrow(ConflictException);
  });

  it('scopes lookups by tenant (isolation)', async () => {
    mockPrisma.treatment_plan_items.findFirst.mockResolvedValue(null);

    await expect(service.findOne('tenant-2', 'item-1')).rejects.toThrow(NotFoundException);
    expect(mockPrisma.treatment_plan_items.findFirst).toHaveBeenCalledWith({ where: { id: 'item-1', tenantId: 'tenant-2' } });
  });
});
