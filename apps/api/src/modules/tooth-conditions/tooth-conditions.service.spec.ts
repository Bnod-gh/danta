import { ToothConditionsService } from './tooth-conditions.service';
import { AuditService } from '../audit/audit.service';
import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';

describe('ToothConditionsService', () => {
  let service: ToothConditionsService;

  const mockPrisma = {
    dentalChart: { findFirst: jest.fn() },
    toothCondition: {
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
  };
  const audit = { log: jest.fn().mockResolvedValue(undefined) } as unknown as AuditService;

  const baseFinding = {
    id: 'f1',
    tenantId: 'tenant-1',
    dentalChartId: 'chart-1',
    toothNumber: '16',
    condition: 'caries',
    surface: 'occlusal',
    surfaces: ['occlusal'],
    severity: null,
    status: 'planned',
    notes: null,
    providerId: null,
    createdByUserId: null,
    supersedesId: null,
    resolvedAt: null,
    removedAt: null,
    createdAt: new Date('2026-08-01T09:00:00Z'),
    updatedAt: new Date('2026-08-01T09:00:00Z'),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    service = new ToothConditionsService(mockPrisma as never, audit);
    mockPrisma.dentalChart.findFirst.mockResolvedValue({ id: 'chart-1' });
    mockPrisma.toothCondition.findFirst.mockResolvedValue({ ...baseFinding });
    mockPrisma.toothCondition.create.mockImplementation(async ({ data }: { data: Record<string, unknown> }) => ({ id: 'new', ...data }));
    mockPrisma.toothCondition.update.mockImplementation(async ({ data }: { data: Record<string, unknown> }) => ({ ...baseFinding, ...data }));
  });

  it('creates a finding with normalized multi-surface data and FDI validation', async () => {
    const created = await service.create('tenant-1', 'user-1', {
      dentalChartId: 'chart-1',
      toothNumber: '16',
      condition: 'caries',
      surfaces: ['occlusal', 'mesial', 'occlusal'] as never[],
      status: 'planned',
      scope: 'tooth',
      dentition: 'permanent',
    });

    expect(created.surfaces).toEqual(['occlusal', 'mesial']);
    expect(created.surface).toBe('occlusal');
    expect(mockPrisma.toothCondition.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ tenantId: 'tenant-1', createdByUserId: 'user-1' }) }),
    );
  });

  it('rejects invalid tooth numbers on create', async () => {
    await expect(
      service.create('tenant-1', 'user-1', {
        dentalChartId: 'chart-1',
        toothNumber: '99',
        condition: 'caries',
        status: 'planned',
        scope: 'tooth',
        dentition: 'permanent',
      }),
    ).rejects.toThrow(BadRequestException);
  });

  it('throws when the chart belongs to another tenant (isolation)', async () => {
    mockPrisma.dentalChart.findFirst.mockResolvedValue(null);

    await expect(
      service.create('tenant-1', 'user-1', {
        dentalChartId: 'other-tenant-chart',
        toothNumber: '16',
        condition: 'caries',
        status: 'planned',
        scope: 'tooth',
        dentition: 'permanent',
      }),
    ).rejects.toThrow(NotFoundException);
  });

  it('edits active findings in place and honours the optimistic concurrency token', async () => {
    await service.update('tenant-1', 'user-1', 'f1', {
      notes: 'deep',
      expectedUpdatedAt: baseFinding.updatedAt.toISOString(),
    });
    expect(mockPrisma.toothCondition.update).toHaveBeenCalled();
  });

  it('rejects stale writes with a conflict', async () => {
    await expect(
      service.update('tenant-1', 'user-1', 'f1', {
        notes: 'stale',
        expectedUpdatedAt: new Date('2020-01-01T00:00:00Z').toISOString(),
      }),
    ).rejects.toThrow(ConflictException);
  });

  it('amends rather than overwrites resolved findings', async () => {
    mockPrisma.toothCondition.findFirst.mockResolvedValue({
      ...baseFinding,
      status: 'resolved',
      resolvedAt: new Date('2026-08-02T00:00:00Z'),
    });
    const $transaction = jest.fn((fn: (tx: unknown) => Promise<unknown>) =>
      fn({
        toothCondition: {
          update: jest.fn().mockResolvedValue({}),
          create: jest.fn().mockImplementation(async ({ data }: { data: Record<string, unknown> }) => ({ id: 'amended', ...data })),
        },
      }),
    );
    (mockPrisma as unknown as { $transaction: unknown }).$transaction = $transaction;

    const amended = await service.update('tenant-1', 'user-1', 'f1', { condition: 'crown' });

    expect(amended.id).toBe('amended');
    expect((amended as { supersedesId?: string }).supersedesId).toBe('f1');
    expect($transaction).toHaveBeenCalled();
    expect(audit.log).toHaveBeenCalledWith(expect.objectContaining({ action: 'tooth_condition.amend' }));
  });

  it('soft-deletes so historical odontograms stay reconstructable', async () => {
    const result = await service.remove('tenant-1', 'user-1', 'f1');

    expect(result).toEqual({ deleted: true });
    expect(mockPrisma.toothCondition.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ status: 'removed' }) }),
    );
    expect(mockPrisma.toothCondition.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ removedAt: expect.any(Date) }) }),
    );
  });
});
