import { DentalChartsService } from './dental-charts.service';
import { AuditService } from '../audit/audit.service';

describe('DentalChartsService', () => {
  let service: DentalChartsService;
  const mockPrisma = {
    dentalChart: { findFirst: jest.fn(), findMany: jest.fn(), create: jest.fn(), update: jest.fn(), delete: jest.fn() },
    toothCondition: { findMany: jest.fn(), createMany: jest.fn() },
    toothConditionConfig: { findMany: jest.fn() },
    treatmentPlan: { create: jest.fn() },
    treatment_plan_items: { createMany: jest.fn() },
    provider: { findFirst: jest.fn() },
  };
  const audit = { log: jest.fn().mockResolvedValue(undefined) } as unknown as AuditService;

  const baseChart = {
    id: 'chart-1',
    tenantId: 'tenant-1',
    patientId: 'patient-1',
    chartDate: new Date(),
    notes: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    dentition: 'permanent',
    conditions: [],
  };

  beforeEach(() => {
    jest.clearAllMocks();
    service = new DentalChartsService(mockPrisma as never, audit);
    mockPrisma.dentalChart.findFirst.mockResolvedValue(baseChart);
    mockPrisma.dentalChart.findMany.mockResolvedValue([]);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('generatePlanFromChart', () => {
    const tenantId = 'tenant-1';
    const userId = 'user-1';
    const chartId = 'chart-1';

    it('throws when no charted conditions exist', async () => {
      mockPrisma.dentalChart.findFirst.mockResolvedValue(baseChart);
      mockPrisma.toothCondition.findMany.mockResolvedValue([]);

      await expect(
        service.generatePlanFromChart(tenantId, userId, chartId, {}),
      ).rejects.toThrow('No charted conditions map to planned treatment yet');
    });

    it('generates a proposed plan from mapped conditions', async () => {
      mockPrisma.dentalChart.findFirst.mockResolvedValue(baseChart);
      mockPrisma.toothCondition.findMany.mockResolvedValue([
        {
          id: 'c1',
          tenantId,
          dentalChartId: chartId,
          toothNumber: '16',
          condition: 'caries',
          surface: 'occlusal',
          surfaces: ['occlusal'],
          status: 'planned',
          notes: null,
          providerId: null,
          createdByUserId: userId,
          procedureCodeId: null,
          clinicalModule: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ]);
      mockPrisma.toothConditionConfig.findMany.mockResolvedValue([
        {
          id: 'cfg1',
          tenantId,
          code: 'caries',
          name: 'Caries',
          category: 'diagnosis',
          color: '#dc2626',
          surfaces: ['occlusal', 'mesial', 'distal', 'buccal', 'lingual'],
          cdtCode: 'D2392',
          cdtDescription: 'Composite restoration — two surfaces',
          cdtFee: 220,
          icon: null,
          order: 1,
          active: true,
          isSystem: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ]);
      mockPrisma.provider.findFirst.mockResolvedValue({
        id: 'prov-1',
        tenantId,
        userId: 'user-1',
        firstName: 'Jane',
        lastName: 'Doe',
        email: 'jane@example.com',
        phone: null,
        color: null,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      mockPrisma.treatmentPlan.create.mockResolvedValue({
        id: 'plan-1',
        tenantId,
        patientId: 'patient-1',
        providerId: 'prov-1',
        name: 'Generated from chart chart-1',
        status: 'proposed',
        notes: null,
        approvedAt: null,
        approvedBy: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        supersedesId: null,
        version: 1,
        patient: { id: 'patient-1', firstName: 'Test', lastName: 'Patient' },
        provider: { id: 'prov-1', firstName: 'Jane', lastName: 'Doe' },
      });
      mockPrisma.treatment_plan_items.createMany.mockResolvedValue({ count: 1 });

      const result = await service.generatePlanFromChart(tenantId, userId, chartId, {});

      expect(result.plan.id).toBe('plan-1');
      expect(result.items).toHaveLength(1);
      expect(result.items[0]).toMatchObject({
        toothNumber: '16',
        surface: 'occlusal',
        code: 'D2392',
        defaultFee: 220,
      });
      expect(result.estimatedTotal).toBe(220);
      expect(audit.log).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'treatment_plan.generate_from_chart',
          resourceId: 'plan-1',
        }),
      );
    });

    it('auto-assigns the first active provider when providerId is omitted', async () => {
      mockPrisma.dentalChart.findFirst.mockResolvedValue(baseChart);
      mockPrisma.toothCondition.findMany.mockResolvedValue([
        {
          id: 'c1',
          tenantId,
          dentalChartId: chartId,
          toothNumber: '16',
          condition: 'extraction',
          surface: null,
          surfaces: [],
          status: 'planned',
          notes: null,
          providerId: null,
          createdByUserId: userId,
          procedureCodeId: null,
          clinicalModule: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ]);
      mockPrisma.toothConditionConfig.findMany.mockResolvedValue([
        {
          id: 'cfg2',
          tenantId,
          code: 'extraction',
          name: 'Extraction Needed',
          category: 'surgery',
          color: '#ea580c',
          surfaces: [],
          cdtCode: 'D7140',
          cdtDescription: 'Extraction — erupted tooth or exposed root',
          cdtFee: 250,
          icon: null,
          order: 7,
          active: true,
          isSystem: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ]);
      mockPrisma.provider.findFirst.mockResolvedValue({
        id: 'prov-auto',
        tenantId,
        userId: 'user-2',
        firstName: 'Auto',
        lastName: 'Provider',
        email: 'auto@example.com',
        phone: null,
        color: null,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      mockPrisma.treatmentPlan.create.mockResolvedValue({
        id: 'plan-2',
        tenantId,
        patientId: 'patient-1',
        providerId: 'prov-auto',
        name: 'Generated from chart chart-1',
        status: 'proposed',
        notes: null,
        approvedAt: null,
        approvedBy: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        supersedesId: null,
        version: 1,
        patient: { id: 'patient-1', firstName: 'Test', lastName: 'Patient' },
        provider: { id: 'prov-auto', firstName: 'Auto', lastName: 'Provider' },
      });
      mockPrisma.treatment_plan_items.createMany.mockResolvedValue({ count: 1 });

      const result = await service.generatePlanFromChart(tenantId, userId, chartId, {});

      expect(result.plan.id).toBe('plan-2');
      expect(result.items[0].code).toBe('D7140');
      expect(result.estimatedTotal).toBe(250);
    });

    it('skips conditions without a CDT code mapping', async () => {
      mockPrisma.dentalChart.findFirst.mockResolvedValue(baseChart);
      mockPrisma.toothCondition.findMany.mockResolvedValue([
        {
          id: 'c1',
          tenantId,
          dentalChartId: chartId,
          toothNumber: '16',
          condition: 'missing',
          surface: null,
          surfaces: [],
          status: 'planned',
          notes: null,
          providerId: null,
          createdByUserId: userId,
          procedureCodeId: null,
          clinicalModule: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ]);
      mockPrisma.toothConditionConfig.findMany.mockResolvedValue([
        {
          id: 'cfg3',
          tenantId,
          code: 'missing',
          name: 'Missing',
          category: 'diagnosis',
          color: '#94a3b8',
          surfaces: [],
          cdtCode: null,
          cdtDescription: null,
          cdtFee: null,
          icon: null,
          order: 6,
          active: true,
          isSystem: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ]);

      await expect(
        service.generatePlanFromChart(tenantId, userId, chartId, {}),
      ).rejects.toThrow('No charted conditions map to planned treatment yet');
    });
  });
});
