import { apiGet, apiPost, apiPut, apiDelete } from './request';
import type {
  ClinicalModule,
  SchedulingResource,
  SchedulingResourceModule,
  CreateSchedulingResource,
  CreateSchedulingResourceModule,
} from '@danta/schemas';

/**
 * Get all system clinical modules
 */
export async function getClinicalModules(): Promise<ClinicalModule[]> {
  return apiGet('/clinical-modules/modules');
}

/**
 * Get clinical modules by category
 */
export async function getClinicalModulesByCategory(category: string): Promise<ClinicalModule[]> {
  return apiGet(`/clinical-modules/modules/category/${category}`);
}

/**
 * Get all scheduling resources for the tenant
 */
export async function getTenantSchedulingResources(): Promise<
  (SchedulingResource & { modules: (SchedulingResourceModule & { clinicalModule: ClinicalModule })[] })[]
> {
  return apiGet('/clinical-modules/resources');
}

/**
 * Get a specific scheduling resource with its modules
 */
export async function getSchedulingResource(resourceId: string): Promise<
  (SchedulingResource & { modules: (SchedulingResourceModule & { clinicalModule: ClinicalModule })[] }) | null
> {
  return apiGet(`/clinical-modules/resources/${resourceId}`);
}

/**
 * Create a new scheduling resource
 */
export async function createSchedulingResource(data: CreateSchedulingResource): Promise<SchedulingResource> {
  return apiPost('/clinical-modules/resources', data);
}

/**
 * Update a scheduling resource
 */
export async function updateSchedulingResource(
  resourceId: string,
  data: Partial<Omit<CreateSchedulingResource, 'type'>>
): Promise<SchedulingResource> {
  return apiPut(`/clinical-modules/resources/${resourceId}`, data);
}

/**
 * Add a module to a scheduling resource
 */
export async function addModuleToResource(
  resourceId: string,
  moduleId: string,
  data?: Omit<CreateSchedulingResourceModule, 'clinicalModuleId'>
): Promise<SchedulingResourceModule> {
  return apiPost(`/clinical-modules/resources/${resourceId}/modules/${moduleId}`, data || {});
}

/**
 * Update a resource-module association
 */
export async function updateResourceModule(
  resourceId: string,
  moduleId: string,
  data: Partial<Omit<CreateSchedulingResourceModule, 'clinicalModuleId'>>
): Promise<SchedulingResourceModule> {
  return apiPut(`/clinical-modules/resources/${resourceId}/modules/${moduleId}`, data);
}

/**
 * Remove a module from a scheduling resource
 */
export async function removeModuleFromResource(resourceId: string, moduleId: string): Promise<{ deleted: boolean }> {
  return apiDelete(`/clinical-modules/resources/${resourceId}/modules/${moduleId}`);
}

/**
 * Get active modules for a scheduling resource
 */
export async function getActiveModulesForResource(
  resourceId: string
): Promise<(SchedulingResourceModule & { clinicalModule: ClinicalModule })[]> {
  return apiGet(`/clinical-modules/resources/${resourceId}/modules/active`);
}
