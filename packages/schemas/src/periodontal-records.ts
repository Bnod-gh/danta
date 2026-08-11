import { z } from 'zod';

export const PeriodontalRecordSchema = z.object({
  id: z.string().uuid(),
  tenantId: z.string().uuid(),
  patientId: z.string().uuid(),
  providerId: z.string().uuid(),
  chartDate: z.date(),
  toothNumber: z.string(),
  pocketDepth: z.number().optional(),
  recession: z.number().optional(),
  bleeding: z.boolean(),
  plaque: z.boolean(),
  notes: z.string().optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type PeriodontalRecord = z.infer<typeof PeriodontalRecordSchema>;

export const CreatePeriodontalRecordSchema = z.object({
  patientId: z.string().uuid(),
  providerId: z.string().uuid(),
  toothNumber: z.string().min(1).max(10),
  pocketDepth: z.number().optional(),
  recession: z.number().optional(),
  bleeding: z.boolean().default(false),
  plaque: z.boolean().default(false),
  notes: z.string().max(500).optional(),
});

export type CreatePeriodontalRecord = z.infer<typeof CreatePeriodontalRecordSchema>;

export const UpdatePeriodontalRecordSchema = z.object({
  toothNumber: z.string().min(1).max(10).optional(),
  pocketDepth: z.number().optional(),
  recession: z.number().optional(),
  bleeding: z.boolean().optional(),
  plaque: z.boolean().optional(),
  notes: z.string().max(500).optional(),
});

export type UpdatePeriodontalRecord = z.infer<typeof UpdatePeriodontalRecordSchema>;
