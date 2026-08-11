import { z } from 'zod';

export const ToothConditionSchema = z.object({
  id: z.string().uuid(),
  tenantId: z.string().uuid(),
  dentalChartId: z.string().uuid(),
  toothNumber: z.string(),
  condition: z.string(),
  surface: z.string().optional(),
  status: z.string(),
  notes: z.string().optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type ToothCondition = z.infer<typeof ToothConditionSchema>;

export const CreateToothConditionSchema = z.object({
  dentalChartId: z.string().uuid(),
  toothNumber: z.string().min(1).max(10),
  condition: z.string().min(1).max(255),
  surface: z.string().max(50).optional(),
  status: z.string().default('active'),
  notes: z.string().max(500).optional(),
});

export type CreateToothCondition = z.infer<typeof CreateToothConditionSchema>;

export const UpdateToothConditionSchema = CreateToothConditionSchema.partial();

export type UpdateToothCondition = z.infer<typeof UpdateToothConditionSchema>;
