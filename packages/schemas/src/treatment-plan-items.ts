import { z } from 'zod';
import { ToothNumberSchema } from './tooth-conditions';
import { ToothSurfaceSchema } from './dental-charting';

export const PlanItemPrioritySchema = z.enum(['low', 'routine', 'high', 'urgent']);
export type PlanItemPriority = z.infer<typeof PlanItemPrioritySchema>;

export const TreatmentPlanItemStatusSchema = z.enum([
  'planned',
  'accepted',
  'declined',
  'scheduled',
  'in_progress',
  'completed',
  'partially_completed',
  'cancelled',
]);
export type TreatmentPlanItemStatus = z.infer<typeof TreatmentPlanItemStatusSchema>;

/** Allowed status transitions enforced server-side. */
export const PLAN_ITEM_TRANSITIONS: Record<TreatmentPlanItemStatus, TreatmentPlanItemStatus[]> = {
  planned: ['accepted', 'declined', 'scheduled', 'cancelled'],
  accepted: ['scheduled', 'in_progress', 'cancelled'],
  declined: ['planned'],
  scheduled: ['in_progress', 'cancelled', 'scheduled'],
  in_progress: ['completed', 'partially_completed', 'scheduled'],
  partially_completed: ['in_progress', 'completed', 'cancelled'],
  completed: [],
  cancelled: ['planned'],
};

const money = z.number().nonnegative();
const percent = z.number().min(0).max(100);

export const TreatmentPlanItemSchema = z.object({
  id: z.string().uuid(),
  tenantId: z.string().uuid(),
  planId: z.string().uuid(),
  serviceId: z.string().uuid().nullable().optional(),
  providerId: z.string().uuid().nullable().optional(),
  appointmentId: z.string().uuid().nullable().optional(),
  treatmentCode: z.string().nullable().optional(),
  description: z.string(),
  toothNumber: z.string().nullable().optional(),
  surfaces: z.array(ToothSurfaceSchema),
  quantity: z.number().int(),
  unitPrice: z.number(),
  discount: z.number(),
  taxRate: z.number(),
  estimatedMinutes: z.number().int().nullable().optional(),
  priority: PlanItemPrioritySchema,
  status: TreatmentPlanItemStatusSchema,
  notes: z.string().nullable().optional(),
  completedAt: z.date().nullable().optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
});
export type TreatmentPlanItem = z.infer<typeof TreatmentPlanItemSchema>;

export const CreateTreatmentPlanItemSchema = z.object({
  planId: z.string().uuid(),
  serviceId: z.string().uuid().optional(),
  providerId: z.string().uuid().optional(),
  treatmentCode: z.string().max(16).optional(),
  description: z.string().min(1).max(255),
  toothNumber: ToothNumberSchema.optional(),
  surfaces: z.array(ToothSurfaceSchema).max(6).optional(),
  quantity: z.number().int().positive().default(1),
  unitPrice: money,
  discount: money.default(0),
  taxRate: percent.default(0),
  estimatedMinutes: z.number().int().positive().max(600).optional(),
  priority: PlanItemPrioritySchema.default('routine'),
  notes: z.string().max(500).optional(),
  appointmentId: z.string().uuid().optional(),
});
export type CreateTreatmentPlanItem = z.infer<typeof CreateTreatmentPlanItemSchema>;

export const UpdateTreatmentPlanItemSchema = z.object({
  serviceId: z.string().uuid().nullable().optional(),
  providerId: z.string().uuid().nullable().optional(),
  treatmentCode: z.string().max(16).nullable().optional(),
  description: z.string().min(1).max(255).optional(),
  toothNumber: ToothNumberSchema.nullable().optional(),
  surfaces: z.array(ToothSurfaceSchema).max(6).optional(),
  quantity: z.number().int().positive().optional(),
  unitPrice: money.optional(),
  discount: money.optional(),
  taxRate: percent.optional(),
  estimatedMinutes: z.number().int().positive().max(600).nullable().optional(),
  priority: PlanItemPrioritySchema.optional(),
  notes: z.string().max(500).nullable().optional(),
  expectedUpdatedAt: z.string().datetime().optional(),
});
export type UpdateTreatmentPlanItem = z.infer<typeof UpdateTreatmentPlanItemSchema>;

export const TransitionTreatmentPlanItemSchema = z.object({
  status: TreatmentPlanItemStatusSchema,
  appointmentId: z.string().uuid().optional(),
  note: z.string().max(500).optional(),
  expectedUpdatedAt: z.string().datetime().optional(),
});
export type TransitionTreatmentPlanItem = z.infer<typeof TransitionTreatmentPlanItemSchema>;
