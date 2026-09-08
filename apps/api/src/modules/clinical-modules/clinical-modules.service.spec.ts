import { Test, TestingModule } from '@nestjs/testing';
import { ClinicalModulesService } from './clinical-modules.service';
import { PrismaService } from '../../prisma.service';

describe('ClinicalModulesService', () => {
  let service: ClinicalModulesService;
  let prisma: PrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ClinicalModulesService,
        {
          provide: PrismaService,
          useValue: {
            clinicalModule: {
              findMany: jest.fn(),
              findFirst: jest.fn(),
              create: jest.fn(),
            },
            schedulingResource: {
              findMany: jest.fn(),
              findFirst: jest.fn(),
              create: jest.fn(),
              update: jest.fn(),
            },
            schedulingResourceModule: {
              findMany: jest.fn(),
              create: jest.fn(),
              delete: jest.fn(),
              update: jest.fn(),
            },
          },
        },
      ],
    }).compile();

    service = module.get<ClinicalModulesService>(ClinicalModulesService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getClinicalModules', () => {
    it('should return all clinical modules', async () => {
      const mockModules = [
        {
          id: '1',
          type: 'odontogram_diagnosis',
          name: 'Diagnosis',
          displayName: 'Diagnosis',
          description: 'Test',
          category: 'odontogram',
          order: 1,
          config: {},
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      jest.spyOn(prisma.clinicalModule, 'findMany').mockResolvedValue(mockModules);

      const result = await service.getClinicalModules();

      expect(result).toEqual(mockModules);
      expect(prisma.clinicalModule.findMany).toHaveBeenCalled();
    });
  });

  describe('getTenantSchedulingResources', () => {
    it('should return scheduling resources for a tenant', async () => {
      const tenantId = 'test-tenant-id';
      const mockResources = [
        {
          id: '1',
          tenantId,
          type: 'odontogram',
          name: 'Dental Chart',
          description: 'Test',
          active: true,
          settings: {},
          createdAt: new Date(),
          updatedAt: new Date(),
          modules: [],
        },
      ];

      jest.spyOn(prisma.clinicalModule, 'findMany').mockResolvedValue([]);
      jest.spyOn(prisma.schedulingResource, 'findFirst').mockResolvedValue({ id: '1', tenantId } as never);
      jest.spyOn(prisma.schedulingResource, 'findMany').mockResolvedValue(mockResources);

      const result = await service.getTenantSchedulingResources(tenantId);

      expect(result).toEqual(mockResources);
      expect(prisma.schedulingResource.findMany).toHaveBeenCalledWith({
        where: { tenantId },
        include: expect.any(Object),
        orderBy: { createdAt: 'asc' },
      });
    });
  });

  describe('getActiveModulesForResource', () => {
    it('should return only active modules', async () => {
      const resourceId = 'resource-1';
      const mockModules = [
        { id: 'a', schedulingResourceId: resourceId, clinicalModuleId: 'm1', active: true, order: 1, settings: {}, createdAt: new Date(), updatedAt: new Date(), clinicalModule: { id: 'm1', type: 'odontogram_diagnosis', name: 'Diagnosis', displayName: 'Diagnosis', description: null, category: 'odontogram', order: 1, config: {}, createdAt: new Date(), updatedAt: new Date() } },
        { id: 'b', schedulingResourceId: resourceId, clinicalModuleId: 'm2', active: false, order: 2, settings: {}, createdAt: new Date(), updatedAt: new Date(), clinicalModule: { id: 'm2', type: 'odontogram_restorative', name: 'Restorative', displayName: 'Restorative', description: null, category: 'odontogram', order: 2, config: {}, createdAt: new Date(), updatedAt: new Date() } },
      ];
      jest.spyOn(prisma.schedulingResourceModule, 'findMany').mockResolvedValue([mockModules[0]] as never);

      const result = await service.getActiveModulesForResource(resourceId);

      expect(result).toHaveLength(1);
      expect(result[0].clinicalModule.type).toBe('odontogram_diagnosis');
      expect(prisma.schedulingResourceModule.findMany).toHaveBeenCalledWith({
        where: { schedulingResourceId: resourceId, active: true },
        include: { clinicalModule: true },
        orderBy: { order: 'asc' },
      });
    });
  });

  describe('addModuleToResource', () => {
    it('should throw when the resource does not belong to the tenant', async () => {
      jest.spyOn(prisma.schedulingResource, 'findFirst').mockResolvedValue(null);
      await expect(
        service.addModuleToResource('tenant-x', 'resource-1', 'module-1', { active: true, order: 1 }),
      ).rejects.toThrow(/does not belong to this tenant/);
    });

    it('should create the association for a tenant-owned resource', async () => {
      jest.spyOn(prisma.schedulingResource, 'findFirst').mockResolvedValue({ id: 'resource-1', tenantId: 'tenant-x' } as never);
      const created = { id: 'link-1', schedulingResourceId: 'resource-1', clinicalModuleId: 'module-1', active: true, order: 1, settings: {} };
      jest.spyOn(prisma.schedulingResourceModule, 'create').mockResolvedValue(created as never);
      const result = await service.addModuleToResource('tenant-x', 'resource-1', 'module-1', { active: true, order: 1 });
      expect(result).toEqual(created);
    });
  });

  describe('removeModuleFromResource', () => {
    it('should delete the association', async () => {
      const del = jest.spyOn(prisma.schedulingResourceModule, 'delete').mockResolvedValue({} as never);
      await service.removeModuleFromResource('resource-1', 'module-1');
      expect(del).toHaveBeenCalledWith({
        where: { schedulingResourceId_clinicalModuleId: { schedulingResourceId: 'resource-1', clinicalModuleId: 'module-1' } },
      });
    });
  });
});
