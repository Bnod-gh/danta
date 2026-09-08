import { z } from "zod";
import {
  ToothSurfaceSchema,
  ClinicalStatusSchema,
  FindingSeveritySchema,
  DentitionSchema,
  FindingScopeSchema,
  ToothNumberSchema,
  isValidToothNumber,
  FindingSeverity,
  Dentition,
  FindingScope,
} from "./dental-charting";

export { FindingSeveritySchema, DentitionSchema, FindingScopeSchema, ToothNumberSchema, isValidToothNumber };
export type { FindingSeverity, Dentition, FindingScope };

export const ToothFindingStatusSchema = z.enum([
  "planned",
  "existing",
  "watch",
  "resolved",
  "superseded",
  "removed",
]);
export type ToothFindingStatus = z.infer<typeof ToothFindingStatusSchema>;

export const ToothFindingInitialStatusSchema = z.enum(["planned", "existing", "watch"]);

export const ToothConditionSchema = z.object({
  id: z.string().uuid(),
  tenantId: z.string().uuid(),
  dentalChartId: z.string().uuid(),
  toothNumber: z.string().nullable(),
  condition: z.string(),
  scope: FindingScopeSchema.default("tooth"),
  dentition: DentitionSchema.default("permanent"),
  surface: z.string().nullable().optional(),
  surfaces: z.array(ToothSurfaceSchema),
  severity: FindingSeveritySchema.nullable().optional(),
  status: z.string(),
  notes: z.string().nullable().optional(),
  providerId: z.string().uuid().nullable().optional(),
  procedureCodeId: z.string().uuid().nullable().optional(),
  createdByUserId: z.string().uuid().nullable().optional(),
  supersedesId: z.string().uuid().nullable().optional(),
  resolvedAt: z.date().nullable().optional(),
  removedAt: z.date().nullable().optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
  clinicalModule: z.string().nullable().optional(),
  clinicalStatus: ClinicalStatusSchema.nullable().optional(),
  diagnosis: z.string().nullable().optional(),
  treatmentPlan: z.string().nullable().optional(),
  inProgress: z.boolean().optional(),
  completedAt: z.date().nullable().optional(),
});
export type ToothCondition = z.infer<typeof ToothConditionSchema>;

export const CreateToothConditionSchema = z.object({
  dentalChartId: z.string().uuid(),
  toothNumber: ToothNumberSchema.optional(),
  condition: z.string().min(1).max(50),
  scope: FindingScopeSchema.default("tooth"),
  dentition: DentitionSchema.default("permanent"),
  surfaces: z.array(ToothSurfaceSchema).max(6).optional(),
  surface: ToothSurfaceSchema.optional(),
  severity: FindingSeveritySchema.optional(),
  status: ToothFindingInitialStatusSchema.default("planned"),
  notes: z.string().max(500).optional(),
  providerId: z.string().uuid().optional(),
  procedureCodeId: z.string().uuid().optional(),
  clinicalModule: z.string().max(100).optional(),
  clinicalStatus: ClinicalStatusSchema.optional(),
  diagnosis: z.string().optional(),
  treatmentPlan: z.string().optional(),
  inProgress: z.boolean().optional(),
  completedAt: z.date().optional(),
});
export type CreateToothCondition = z.infer<typeof CreateToothConditionSchema>;

export const BatchCreateToothConditionSchema = z.object({
  dentalChartId: z.string().uuid(),
  condition: z.string().min(1).max(50),
  dentition: DentitionSchema.default("permanent"),
  scope: FindingScopeSchema.default("tooth"),
  teeth: z.array(ToothNumberSchema).min(1).max(32),
  surfaces: z.array(ToothSurfaceSchema).max(6).optional(),
  severity: FindingSeveritySchema.optional(),
  status: ToothFindingInitialStatusSchema.default("planned"),
  notes: z.string().max(500).optional(),
  providerId: z.string().uuid().optional(),
  procedureCodeId: z.string().uuid().optional(),
  clinicalModule: z.string().max(100).optional(),
});
export type BatchCreateToothCondition = z.infer<typeof BatchCreateToothConditionSchema>;

export const UpdateToothConditionSchema = z.object({
  condition: z.string().min(1).max(50).optional(),
  surfaces: z.array(ToothSurfaceSchema).max(6).optional(),
  surface: ToothSurfaceSchema.optional(),
  severity: FindingSeveritySchema.optional(),
  status: z.enum(["planned", "existing", "watch", "resolved"]).optional(),
  notes: z.string().max(500).nullable().optional(),
  providerId: z.string().uuid().nullable().optional(),
  expectedUpdatedAt: z.string().datetime().optional(),
  clinicalModule: z.string().max(100).optional(),
  clinicalStatus: ClinicalStatusSchema.optional(),
  diagnosis: z.string().nullable().optional(),
  treatmentPlan: z.string().nullable().optional(),
  inProgress: z.boolean().optional(),
  completedAt: z.date().nullable().optional(),
});
export type UpdateToothCondition = z.infer<typeof UpdateToothConditionSchema>;