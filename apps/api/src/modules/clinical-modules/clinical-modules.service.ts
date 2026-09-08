import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import { DEFAULT_ODONTOGRAM_MODULES, DEFAULT_ODONTOGRAM_RESOURCE, type CreateSchedulingResource, type CreateSchedulingResourceModule } from '@danta/schemas';
import type { ClinicalModule, SchedulingResource, SchedulingResourceModule } from '@prisma/client';

@Injectable()
export class ClinicalModulesService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Initialize default clinical modules (system-wide, call once during setup)
   */
  async initializeDefaultModules(): Promise<ClinicalModule[]> {
    const existing = await this.prisma.clinicalModule.findMany();
    if (existing.length > 0) {
      return existing;
    }

    const created = await Promise.all(
      DEFAULT_ODONTOGRAM_MODULES.map((module) =>
        this.prisma.clinicalModule.create({
          data: {
            type: module.type,
            name: module.name,
            displayName: module.displayName,
            description: module.description,
            category: module.category,
            order: module.order,
            config: module.config || {},
          },
        })
      )
    );

    return created;
  }

  /**
   * Get all system clinical modules
   */
  async getClinicalModules(): Promise<ClinicalModule[]> {
    return this.prisma.clinicalModule.findMany({
      orderBy: { order: 'asc' },
    });
  }

  /**
   * Get clinical modules by category
   */
  async getClinicalModulesByCategory(category: string): Promise<ClinicalModule[]> {
    return this.prisma.clinicalModule.findMany({
      where: { category },
      orderBy: { order: 'asc' },
    });
  }

  /**
   * Initialize default Odontogram resource for a tenant
   */
  async initializeDefaultOdontogramResource(tenantId: string): Promise<SchedulingResource> {
    const existing = await this.prisma.schedulingResource.findFirst({
      where: { tenantId, type: 'odontogram' },
    });

    if (existing) {
      return existing;
    }

    const resource = await this.prisma.schedulingResource.create({
      data: {
        tenantId,
        type: DEFAULT_ODONTOGRAM_RESOURCE.type,
        name: DEFAULT_ODONTOGRAM_RESOURCE.name,
        description: DEFAULT_ODONTOGRAM_RESOURCE.description,
        active: DEFAULT_ODONTOGRAM_RESOURCE.active,
        settings: DEFAULT_ODONTOGRAM_RESOURCE.settings || {},
      },
    });

    // Associate all default modules with the resource
    const modules = await this.getClinicalModulesByCategory('odontogram');
    await Promise.all(
      modules.map((mod) =>
        this.prisma.schedulingResourceModule.create({
          data: {
            schedulingResourceId: resource.id,
            clinicalModuleId: mod.id,
            active: true,
            order: mod.order,
          },
        })
      )
    );

    return resource;
  }

  /**
   * Get scheduling resources for a tenant
   */
  async getTenantSchedulingResources(tenantId: string): Promise<(SchedulingResource & { modules: (SchedulingResourceModule & { clinicalModule: ClinicalModule })[] })[]> {
    // Auto-initialization: ensure system-wide default modules and the tenant's default
    // odontogram resource exist on first access so the module-aware UI works out of the box.
    await this.initializeDefaultModules();
    await this.initializeDefaultOdontogramResource(tenantId);
    return this.prisma.schedulingResource.findMany({
      where: { tenantId },
      include: {
        modules: {
          include: { clinicalModule: true },
          orderBy: { order: 'asc' },
        },
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  /**
   * Get a specific scheduling resource with its modules
   */
  async getSchedulingResource(
    tenantId: string,
    resourceId: string
  ): Promise<(SchedulingResource & { modules: (SchedulingResourceModule & { clinicalModule: ClinicalModule })[] }) | null> {
    return this.prisma.schedulingResource.findFirst({
      where: { tenantId, id: resourceId },
      include: {
        modules: {
          include: { clinicalModule: true },
          orderBy: { order: 'asc' },
        },
      },
    });
  }

  /**
   * Create a scheduling resource for a tenant
   */
  async createSchedulingResource(
    tenantId: string,
    data: CreateSchedulingResource
  ): Promise<SchedulingResource> {
    return this.prisma.schedulingResource.create({
      data: {
        tenantId,
        type: data.type,
        name: data.name,
        description: data.description,
        active: data.active ?? true,
        settings: data.settings || {},
      },
    });
  }

  /**
   * Update a scheduling resource
   */
  async updateSchedulingResource(
    tenantId: string,
    resourceId: string,
    data: Partial<Omit<CreateSchedulingResource, 'type'>>
  ): Promise<SchedulingResource> {
    // Validate that the resource belongs to this tenant
    const resource = await this.prisma.schedulingResource.findFirst({
      where: { id: resourceId, tenantId },
    });
    if (!resource) throw new Error('Resource not found or does not belong to this tenant');

    return this.prisma.schedulingResource.update({
      where: { id: resourceId },
      data: {
        name: data.name,
        description: data.description,
        active: data.active,
        settings: data.settings,
      },
    });
  }

  /**
   * Add a module to a scheduling resource
   */
  async addModuleToResource(
    tenantId: string,
    resourceId: string,
    moduleId: string,
    data?: Omit<CreateSchedulingResourceModule, 'clinicalModuleId'>
  ): Promise<SchedulingResourceModule> {
    // Validate that the resource belongs to this tenant
    const resource = await this.prisma.schedulingResource.findFirst({
      where: { id: resourceId, tenantId },
    });
    if (!resource) throw new Error('Resource not found or does not belong to this tenant');

    return this.prisma.schedulingResourceModule.create({
      data: {
        schedulingResourceId: resourceId,
        clinicalModuleId: moduleId,
        active: data?.active ?? true,
        order: data?.order ?? 0,
        settings: data?.settings || {},
      },
    });
  }

  /**
   * Update a resource-module association
   */
  async updateResourceModule(
    tenantId: string,
    resourceId: string,
    moduleId: string,
    data: Partial<Omit<CreateSchedulingResourceModule, 'clinicalModuleId'>>
  ): Promise<SchedulingResourceModule> {
    // Validate that the resource belongs to this tenant
    const resource = await this.prisma.schedulingResource.findFirst({
      where: { id: resourceId, tenantId },
    });
    if (!resource) throw new Error('Resource not found or does not belong to this tenant');

    return this.prisma.schedulingResourceModule.update({
      where: {
        schedulingResourceId_clinicalModuleId: {
          schedulingResourceId: resourceId,
          clinicalModuleId: moduleId,
        },
      },
      data: {
        active: data.active,
        order: data.order,
        settings: data.settings,
      },
    });
  }

  /**
   * Remove a module from a scheduling resource
   */
  async removeModuleFromResource(resourceId: string, moduleId: string): Promise<void> {
    await this.prisma.schedulingResourceModule.delete({
      where: {
        schedulingResourceId_clinicalModuleId: {
          schedulingResourceId: resourceId,
          clinicalModuleId: moduleId,
        },
      },
    });
  }

  /**
   * Get active modules for a scheduling resource
   */
  async getActiveModulesForResource(resourceId: string): Promise<(SchedulingResourceModule & { clinicalModule: ClinicalModule })[]> {
    return this.prisma.schedulingResourceModule.findMany({
      where: { schedulingResourceId: resourceId, active: true },
      include: { clinicalModule: true },
      orderBy: { order: 'asc' },
    });
  }
}
