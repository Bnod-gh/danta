import { z } from "zod";
import {
  DentalConditionSchema,
  ToothSurfaceSchema,
  universalToFdi,
} from "./dental-charting";

/** Lifecycle of a clinical finding. `superseded` rows are amendments kept for history;
 *  `removed` rows are soft deletions so point-in-time odontograms stay reconstructable. */
export const ToothFindingStatusSchema = z.enum([
  "planned",
  "existing",
  "watch",
  "resolved",
  "superseded",
  "removed",
]);
export type ToothFindingStatus = z.infer<typeof ToothFindingStatusSchema>;

/** Statuses a finding can be created with; terminal states are reached via transitions. */
export const ToothFindingInitialStatusSchema = z.enum(["planned", "existing", "watch"]);

export const FindingSeveritySchema = z.enum(["mild", "moderate", "severe"]);
export type FindingSeverity = z.infer<typeof FindingSeveritySchema>;

export const DentitionSchema = z.enum(["permanent", "primary"]);
export type Dentition = z.infer<typeof DentitionSchema>;

export const FindingScopeSchema = z.enum(["tooth", "mouth"]);
export type FindingScope = z.infer<typeof FindingScopeSchema>;

const FDI_PERMANENT = /^(1[1-8]|2[1-8]|3[1-8]|4[1-8])$/;
const FDI_PRIMARY = /^(5[1-5]|6[1-5]|7[1-5]|8[1-5])$/;

/** Accepts an FDI number (permanent or primary, governed by `dentition`) or a
 *  Universal number (1-32). Default validates permanent only for backward compat. */
export function isValidToothNumber(value: string, dentition: Dentition = "permanent"): boolean {
  if (!/^\d{1,2}$/.test(value)) return false;
  if (value.length === 2) {
    return dentition === "primary" ? FDI_PRIMARY.test(value) : FDI_PERMANENT.test(value);
  }
  try {
    universalToFdi(Number(value));
    return true;
  } catch {
    return false;
  }
}

export const ToothNumberSchema = z
  .string()
  .refine((v) => isValidToothNumber(v), "Tooth must be a valid FDI number (e.g. 16) or Universal number (1-32)");

export const ToothConditionSchema = z.object({
  id: z.string().uuid(),
  tenantId: z.string().uuid(),
  dentalChartId: z.string().uuid(),
  toothNumber: z.string().nullable(),
  condition: z.string(),
  scope: FindingScopeSchema.default("tooth"),
  dentition: DentitionSchema.default("permanent"),
  /** @deprecated legacy single-surface mirror of surfaces[0] */
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
});

export type ToothCondition = z.infer<typeof ToothConditionSchema>;

export const CreateToothConditionSchema = z.object({
  dentalChartId: z.string().uuid(),
  toothNumber: ToothNumberSchema.optional(),
  condition: DentalConditionSchema,
  scope: FindingScopeSchema.default("tooth"),
  dentition: DentitionSchema.default("permanent"),
  /** Structured multi-surface finding. */
  surfaces: z.array(ToothSurfaceSchema).max(6).optional(),
  /** @deprecated use surfaces[] */
  surface: ToothSurfaceSchema.optional(),
  severity: FindingSeveritySchema.optional(),
  status: ToothFindingInitialStatusSchema.default("planned"),
  notes: z.string().max(500).optional(),
  providerId: z.string().uuid().optional(),
  procedureCodeId: z.string().uuid().optional(),
});
export type CreateToothCondition = z.infer<typeof CreateToothConditionSchema>;

/** Batch apply: fan a single treatment across many teeth in one call. */
export const BatchCreateToothConditionSchema = z.object({
  dentalChartId: z.string().uuid(),
  condition: DentalConditionSchema,
  dentition: DentitionSchema.default("permanent"),
  scope: FindingScopeSchema.default("tooth"),
  teeth: z.array(ToothNumberSchema).min(1).max(32),
  surfaces: z.array(ToothSurfaceSchema).max(6).optional(),
  severity: FindingSeveritySchema.optional(),
  status: ToothFindingInitialStatusSchema.default("planned"),
  notes: z.string().max(500).optional(),
  providerId: z.string().uuid().optional(),
  procedureCodeId: z.string().uuid().optional(),
});
export type BatchCreateToothCondition = z.infer<typeof BatchCreateToothConditionSchema>;

/**
 * Editing a finding replaces it with an amending row (`supersedesId`) whenever it has
 * already been resolved, so finalized clinical history is never rewritten silently.
 */
export const UpdateToothConditionSchema = z.object({
  condition: DentalConditionSchema.optional(),
  surfaces: z.array(ToothSurfaceSchema).max(6).optional(),
  surface: ToothSurfaceSchema.optional(),
  severity: FindingSeveritySchema.optional(),
  status: z.enum(["planned", "existing", "watch", "resolved"]).optional(),
  notes: z.string().max(500).nullable().optional(),
  providerId: z.string().uuid().nullable().optional(),
  /** Optimistic concurrency token: rejects the write when another clinician saved first. */
  expectedUpdatedAt: z.string().datetime().optional(),
});
export type UpdateToothCondition = z.infer<typeof UpdateToothConditionSchema>;