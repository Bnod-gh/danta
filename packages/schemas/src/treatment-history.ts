import { z } from 'zod';

export const TreatmentHistorySchema = z.object({
  id: z.string().uuid(),
  tenantId: z.string().uuid(),
  patientId: z.string().uuid(),
  appointmentId: z.string().uuid().optional(),
  providerId: z.string().uuid(),
  treatment: z.string(),
  description: z.string().optional(),
  cost: z.number().optional(),
  date: z.date(),
  status: z.string(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type TreatmentHistory = z.infer<typeof TreatmentHistorySchema>;

export const CreateTreatmentHistorySchema = z.object({
  patientId: z.string().uuid(),
  appointmentId: z.string().uuid().optional(),
  providerId: z.string().uuid(),
  treatment: z.string().min(1).max(255),
  description: z.string().max(1000).optional(),
  cost: z.number().optional(),
  date: z.coerce.date(),
  status: z.string().default('completed'),
});

export type CreateTreatmentHistory = z.infer<typeof CreateTreatmentHistorySchema>;

export const UpdateTreatmentHistorySchema = z.object({
  treatment: z.string().min(1).max(255).optional(),
  description: z.string().max(1000).optional(),
  cost: z.number().optional(),
  date: z.coerce.date().optional(),
  status: z.string().optional(),
});

export type UpdateTreatmentHistory = z.infer<typeof UpdateTreatmentHistorySchema>;
