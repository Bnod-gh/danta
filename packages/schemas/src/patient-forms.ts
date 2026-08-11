import { z } from 'zod';

export const PatientFormTypeSchema = z.enum(['intake', 'medical_history', 'consent', 'feedback', 'other']);

export const PatientFormSchema = z.object({
  id: z.string().uuid(),
  tenantId: z.string().uuid(),
  patientId: z.string().uuid(),
  type: z.string(),
  status: z.string(),
  data: z.record(z.any()).optional(),
  submittedAt: z.date().optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type PatientForm = z.infer<typeof PatientFormSchema>;

export const CreatePatientFormSchema = z.object({
  patientId: z.string().uuid(),
  type: PatientFormTypeSchema,
  data: z.record(z.any()).optional(),
});

export type CreatePatientForm = z.infer<typeof CreatePatientFormSchema>;

export const UpdatePatientFormSchema = z.object({
  status: z.string().optional(),
  data: z.record(z.any()).optional(),
  submittedAt: z.coerce.date().optional(),
});

export type UpdatePatientForm = z.infer<typeof UpdatePatientFormSchema>;

export const PatientFormQuerySchema = z.object({
  patientId: z.string().uuid().optional(),
  type: z.string().optional(),
  status: z.string().optional(),
});

export type PatientFormQuery = z.infer<typeof PatientFormQuerySchema>;
