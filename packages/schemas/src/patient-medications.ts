import { z } from 'zod';

export const PatientMedicationSchema = z.object({
  id: z.string().uuid(),
  tenantId: z.string().uuid(),
  patientId: z.string().uuid(),
  name: z.string(),
  dosage: z.string().optional(),
  frequency: z.string().optional(),
  prescribedBy: z.string().optional(),
  startDate: z.date().optional(),
  endDate: z.date().optional(),
  isActive: z.boolean(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type PatientMedication = z.infer<typeof PatientMedicationSchema>;

export const CreatePatientMedicationSchema = z.object({
  name: z.string().min(1).max(255),
  dosage: z.string().max(100).optional(),
  frequency: z.string().max(100).optional(),
  prescribedBy: z.string().max(255).optional(),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
  isActive: z.boolean().default(true),
});

export type CreatePatientMedication = z.infer<typeof CreatePatientMedicationSchema>;

export const UpdatePatientMedicationSchema = CreatePatientMedicationSchema.partial();

export type UpdatePatientMedication = z.infer<typeof UpdatePatientMedicationSchema>;
