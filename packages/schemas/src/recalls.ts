import { z } from 'zod';

export const RecallTypeSchema = z.enum(['examination', 'hygiene', 'periodontal', 'xray', 'treatment_followup', 'custom']);

export const RecallStatusSchema = z.enum(['due', 'overdue', 'booked', 'completed', 'failed', 'cancelled']);

export const RecallSchema = z.object({
  id: z.string().uuid(),
  tenantId: z.string().uuid(),
  patientId: z.string().uuid(),
  type: RecallTypeSchema,
  status: RecallStatusSchema,
  dueDate: z.date(),
  notes: z.string().optional(),
  contactCount: z.number().int().nonnegative(),
  lastContactAt: z.date().optional(),
  bookedAt: z.date().optional(),
  completedAt: z.date().optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type Recall = z.infer<typeof RecallSchema>;

export const CreateRecallSchema = z.object({
  patientId: z.string().uuid(),
  type: RecallTypeSchema,
  dueDate: z.coerce.date(),
  notes: z.string().max(1000).optional(),
});

export type CreateRecall = z.infer<typeof CreateRecallSchema>;

export const UpdateRecallSchema = z.object({
  type: RecallTypeSchema.optional(),
  status: RecallStatusSchema.optional(),
  dueDate: z.coerce.date().optional(),
  notes: z.string().max(1000).optional(),
  bookedAt: z.coerce.date().optional(),
  completedAt: z.coerce.date().optional(),
});

export type UpdateRecall = z.infer<typeof UpdateRecallSchema>;

export const RecallQuerySchema = z.object({
  patientId: z.string().uuid().optional(),
  type: RecallTypeSchema.optional(),
  status: RecallStatusSchema.optional(),
  overdue: z.coerce.boolean().optional(),
});

export type RecallQuery = z.infer<typeof RecallQuerySchema>;
