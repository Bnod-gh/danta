import { z } from 'zod';

export const PatientMedicalHistorySchema = z.object({
  id: z.string().uuid(),
  tenantId: z.string().uuid(),
  patientId: z.string().uuid(),
  condition: z.string(),
  notes: z.string().optional(),
  diagnosedAt: z.date().optional(),
  isActive: z.boolean(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type PatientMedicalHistory = z.infer<typeof PatientMedicalHistorySchema>;

export const CreatePatientMedicalHistorySchema = z.object({
  condition: z.string().min(1).max(255),
  notes: z.string().max(1000).optional(),
  diagnosedAt: z.coerce.date().optional(),
  isActive: z.boolean().default(true),
});

export type CreatePatientMedicalHistory = z.infer<typeof CreatePatientMedicalHistorySchema>;

export const UpdatePatientMedicalHistorySchema = CreatePatientMedicalHistorySchema.partial();

export type UpdatePatientMedicalHistory = z.infer<typeof UpdatePatientMedicalHistorySchema>;
