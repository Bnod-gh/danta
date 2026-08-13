import { Test, TestingModule } from '@nestjs/testing';
import { ReportsService } from './reports.service';
import { PrismaService } from '../../prisma.service';
import { ReportQuery } from '@danta/schemas';

describe('ReportsService', () => {
  let service: ReportsService;

  const mockPrisma = {
    appointment: {
      count: jest.fn(),
      findMany: jest.fn(),
      groupBy: jest.fn(),
    },
    appointmentType: {
      findMany: jest.fn(),
    },
    provider: {
      findMany: jest.fn(),
    },
    patient: {
      count: jest.fn(),
      groupBy: jest.fn(),
      findMany: jest.fn(),
    },
    payment: {
      count: jest.fn(),
      aggregate: jest.fn(),
      groupBy: jest.fn(),
      findMany: jest.fn(),
    },
    invoice: {
      aggregate: jest.fn(),
      groupBy: jest.fn(),
      count: jest.fn(),
    },
    invoiceItem: {
      groupBy: jest.fn(),
    },
    service: {
      findMany: jest.fn(),
    },
    treatmentHistory: {
      count: jest.fn(),
      aggregate: jest.fn(),
      groupBy: jest.fn(),
      findMany: jest.fn(),
    },
    recall: {
      count: jest.fn(),
      groupBy: jest.fn(),
      aggregate: jest.fn(),
    },
    treatmentPlan: {
      count: jest.fn(),
      groupBy: jest.fn(),
      findMany: jest.fn(),
    },
    chair: {
      findMany: jest.fn(),
    },
    claimIntegration: {
      findMany: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReportsService,
        {
          provide: PrismaService,
          useValue: mockPrisma,
        },
      ],
    }).compile();

    service = module.get<ReportsService>(ReportsService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getDashboard', () => {
    it('should return dashboard metrics', async () => {
      mockPrisma.appointment.count.mockResolvedValue(5);
      mockPrisma.appointment.findMany.mockResolvedValue([
        { patientId: 'p1', appointmentType: { duration: 30 } },
        { patientId: 'p2', appointmentType: { duration: 30 } },
      ] as any);
      mockPrisma.payment.aggregate.mockResolvedValue({ _sum: { amount: 1000 } });
      mockPrisma.invoice.aggregate.mockResolvedValue({ _sum: { balance: 500 } });
      mockPrisma.recall.count.mockResolvedValue(3);

      const result = await service.getDashboard('tenant-1', {} as ReportQuery);
      expect(result.todayAppointments).toBe(5);
      expect(result.todayPatients).toBe(2);
      expect(result.todayRevenue).toBe(1000);
    });
  });

  describe('getClaims', () => {
    it('should return claims analytics', async () => {
      mockPrisma.claimIntegration.findMany.mockResolvedValue([
        { id: '1', provider: 'medibank', isActive: true, healthStatus: 'healthy' },
        { id: '2', provider: 'hcf', isActive: false, healthStatus: 'error' },
      ]);

      const result = await service.getClaims('tenant-1', {} as ReportQuery);
      expect(result.totalIntegrations).toBe(2);
      expect(result.activeIntegrations).toBe(1);
      expect(result.byProvider).toHaveLength(2);
    });
  });

  describe('getPayments', () => {
    it('should return payment analytics', async () => {
      mockPrisma.payment.count.mockResolvedValue(10);
      mockPrisma.payment.aggregate.mockResolvedValue({ _sum: { amount: 5000 } });
      mockPrisma.payment.findMany.mockResolvedValue([
        { method: 'eftpos', amount: 500, receivedAt: new Date() },
      ]);

      const result = await service.getPayments('tenant-1', {} as ReportQuery);
      expect(result.totalPayments).toBe(10);
      expect(result.totalAmount).toBe(5000);
      expect(result.byMethod).toHaveLength(1);
    });
  });

  describe('getChairUtilization', () => {
    it('should return chair utilization', async () => {
      mockPrisma.chair.findMany.mockResolvedValue([
        { id: 'c1', name: 'Chair 1', isActive: true, locationId: null },
      ] as any);
      mockPrisma.appointment.findMany.mockResolvedValue([
        { chairId: 'c1', status: 'completed', appointmentType: { duration: 30 }, chair: { name: 'Chair 1', locationId: null } },
      ] as any);

      const result = await service.getChairUtilization('tenant-1', {} as ReportQuery);
      expect(result.totalChairs).toBe(1);
      expect(result.byChair).toHaveLength(1);
    });
  });

  describe('getNoShows', () => {
    it('should return no-show analysis', async () => {
      mockPrisma.appointment.count.mockResolvedValueOnce(100).mockResolvedValueOnce(1);
      mockPrisma.appointment.findMany.mockResolvedValue([
        {
          status: 'no_show',
          startTime: new Date(),
          appointmentType: { name: 'Checkup' },
          provider: { firstName: 'John', lastName: 'Doe' },
        },
      ] as any);

      const result = await service.getNoShows('tenant-1', {} as ReportQuery);
      expect(result.totalAppointments).toBe(100);
      expect(result.totalNoShows).toBe(1);
    });
  });
});
