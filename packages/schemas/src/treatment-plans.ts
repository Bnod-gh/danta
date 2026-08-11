import { z } from 'zod';

export const TreatmentPlanStatusSchema = z.enum(['draft', 'proposed', 'approved', 'in_progress', 'completed', 'cancelled']);

export const TreatmentPlanSchema = z.object({
  id: z.string().uuid(),
  tenantId: z.string().uuid(),
  patientId: z.string().uuid(),
  providerId: z.string().uuid(),
  name: z.string(),
  status: TreatmentPlanStatusSchema,
  notes: z.string().optional(),
  approvedAt: z.date().optional(),
  approvedBy: z.string().optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type TreatmentPlan = z.infer<typeof TreatmentPlanSchema>;

export const CreateTreatmentPlanSchema = z.object({
  patientId: z.string().uuid(),
  providerId: z.string().uuid(),
  name: z.string().min(1).max(255),
  status: TreatmentPlanStatusSchema.default('draft'),
  notes: z.string().max(1000).optional(),
});

export type CreateTreatmentPlan = z.infer<typeof CreateTreatmentPlanSchema>;

export const UpdateTreatmentPlanSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  status: TreatmentPlanStatusSchema.optional(),
  notes: z.string().max(1000).optional(),
  approvedAt: z.date().optional(),
  approvedBy: z.string().optional(),
});

export type UpdateTreatmentPlan = z.infer<typeof UpdateTreatmentPlanSchema>;
