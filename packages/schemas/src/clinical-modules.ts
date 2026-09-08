import { z } from 'zod';

/**
 * Clinical modules represent clinical disciplines or workflows within a dental practice.
 * Examples: Diagnosis, Restorative, Surgery, Endodontics, Orthodontics, etc.
 */
export const ClinicalModuleSchema = z.object({
  id: z.string().uuid(),
  type: z.string().max(100),
  name: z.string().max(255),
  displayName: z.string().max(255),
  description: z.string().optional(),
  category: z.string().max(50),
  order: z.number().int(),
  config: z.record(z.any()).default({}),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type ClinicalModule = z.infer<typeof ClinicalModuleSchema>;

export const CreateClinicalModuleSchema = z.object({
  type: z.string().max(100),
  name: z.string().max(255),
  displayName: z.string().max(255),
  description: z.string().optional(),
  category: z.string().max(50),
  order: z.number().int().default(0),
  config: z.record(z.any()).optional(),
});

export type CreateClinicalModule = z.infer<typeof CreateClinicalModuleSchema>;

/**
 * Scheduling Resources represent configurable clinical resources like Dental Chart, Periodontal Chart, etc.
 * Each resource can have multiple clinical modules associated with it.
 */
export const SchedulingResourceSchema = z.object({
  id: z.string().uuid(),
  tenantId: z.string().uuid(),
  type: z.string().max(100),
  name: z.string().max(255),
  description: z.string().optional(),
  active: z.boolean(),
  settings: z.record(z.any()).default({}),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type SchedulingResource = z.infer<typeof SchedulingResourceSchema>;

export const CreateSchedulingResourceSchema = z.object({
  type: z.string().max(100),
  name: z.string().max(255),
  description: z.string().optional(),
  active: z.boolean().default(true),
  settings: z.record(z.any()).optional(),
});

export type CreateSchedulingResource = z.infer<typeof CreateSchedulingResourceSchema>;

/**
 * Scheduling Resource Modules represent the association between a resource and a module.
 * Multiple modules can be associated with a single resource (e.g., Dental Chart has Diagnosis, Restorative, etc).
 */
export const SchedulingResourceModuleSchema = z.object({
  id: z.string().uuid(),
  schedulingResourceId: z.string().uuid(),
  clinicalModuleId: z.string().uuid(),
  active: z.boolean(),
  order: z.number().int(),
  settings: z.record(z.any()).default({}),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type SchedulingResourceModule = z.infer<typeof SchedulingResourceModuleSchema>;

export const CreateSchedulingResourceModuleSchema = z.object({
  clinicalModuleId: z.string().uuid(),
  active: z.boolean().default(true),
  order: z.number().int().default(0),
  settings: z.record(z.any()).optional(),
});

export type CreateSchedulingResourceModule = z.infer<typeof CreateSchedulingResourceModuleSchema>;

/**
 * Default clinical modules for Odontogram
 */
export const DEFAULT_ODONTOGRAM_MODULES: CreateClinicalModule[] = [
  {
    type: 'odontogram_diagnosis',
    name: 'Diagnosis',
    displayName: 'Diagnosis',
    description: 'Record dental findings and diagnoses',
    category: 'odontogram',
    order: 1,
  },
  {
    type: 'odontogram_restorative',
    name: 'Restorative',
    displayName: 'Restorative',
    description: 'Record restorative treatments',
    category: 'odontogram',
    order: 2,
  },
  {
    type: 'odontogram_surgery',
    name: 'Surgery',
    displayName: 'Surgery',
    description: 'Record surgical procedures',
    category: 'odontogram',
    order: 3,
  },
  {
    type: 'odontogram_endodontics',
    name: 'Endodontics',
    displayName: 'Endodontics',
    description: 'Record endodontic treatments',
    category: 'odontogram',
    order: 4,
  },
  {
    type: 'odontogram_orthodontics',
    name: 'Orthodontics',
    displayName: 'Orthodontics',
    description: 'Record orthodontic procedures',
    category: 'odontogram',
    order: 5,
  },
  {
    type: 'odontogram_preventive',
    name: 'Preventive',
    displayName: 'Preventive',
    description: 'Record preventive treatments',
    category: 'odontogram',
    order: 6,
  },
  {
    type: 'odontogram_periodontics',
    name: 'Periodontics',
    displayName: 'Periodontics',
    description: 'Record periodontal treatments',
    category: 'odontogram',
    order: 7,
  },
  {
    type: 'odontogram_pediatric',
    name: 'Pediatric',
    displayName: 'Pediatric',
    description: 'Record pediatric dental treatments',
    category: 'odontogram',
    order: 8,
  },
];

/**
 * Default Odontogram scheduling resource
 */
export const DEFAULT_ODONTOGRAM_RESOURCE: CreateSchedulingResource = {
  type: 'odontogram',
  name: 'Dental Chart',
  description: 'Interactive dental odontogram for recording findings and treatments',
  active: true,
  settings: {
    numbering: 'fdi',
    supportsPrimary: true,
    supportsPermanent: true,
  },
};
