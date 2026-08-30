import { z } from 'zod';

export const PatientMedicalContextSchema = z.object({
  id: z.string().uuid(),
  tenantId: z.string().uuid(),
  patientId: z.string().uuid(),
  isPregnant: z.boolean(),
  pregnancyWeek: z.number().int().positive().optional(),
  isLactating: z.boolean(),
  isOnAnticoagulants: z.boolean(),
  anticoagulantMedication: z.string().max(255).optional(),
  inrValue: z.coerce.number().positive().optional(),
  lastInrDate: z.coerce.date().optional(),
  isSmoker: z.boolean(),
  smokingFrequency: z.string().max(100).optional(),
  alcoholConsumption: z.string().max(100).optional(),
  bruxism: z.boolean(),
  adverseAnesthesiaReaction: z.boolean(),
  anesthesiaReactionDetails: z.string().max(500).optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type PatientMedicalContext = z.infer<typeof PatientMedicalContextSchema>;

export const UpsertMedicalContextSchema = z.object({
  isPregnant: z.boolean().optional(),
  pregnancyWeek: z.number().int().positive().optional().nullable(),
  isLactating: z.boolean().optional(),
  isOnAnticoagulants: z.boolean().optional(),
  anticoagulantMedication: z.string().max(255).optional().nullable(),
  inrValue: z.coerce.number().positive().optional().nullable(),
  lastInrDate: z.coerce.date().optional().nullable(),
  isSmoker: z.boolean().optional(),
  smokingFrequency: z.string().max(100).optional().nullable(),
  alcoholConsumption: z.string().max(100).optional().nullable(),
  bruxism: z.boolean().optional(),
  adverseAnesthesiaReaction: z.boolean().optional(),
  anesthesiaReactionDetails: z.string().max(500).optional().nullable(),
});

export type UpsertMedicalContext = z.infer<typeof UpsertMedicalContextSchema>;

export const PatientSurgicalHistorySchema = z.object({
  id: z.string().uuid(),
  tenantId: z.string().uuid(),
  patientId: z.string().uuid(),
  procedure: z.string(),
  surgeryDate: z.coerce.date().optional(),
  complications: z.string().max(500).optional(),
  notes: z.string().max(1000).optional(),
  isActive: z.boolean(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type PatientSurgicalHistory = z.infer<typeof PatientSurgicalHistorySchema>;

export const CreatePatientSurgicalHistorySchema = z.object({
  procedure: z.string().min(1).max(255),
  surgeryDate: z.coerce.date().optional(),
  complications: z.string().max(500).optional(),
  notes: z.string().max(1000).optional(),
  isActive: z.boolean().default(true),
});

export type CreatePatientSurgicalHistory = z.infer<typeof CreatePatientSurgicalHistorySchema>;

export const UpdatePatientSurgicalHistorySchema = CreatePatientSurgicalHistorySchema.partial();

export type UpdatePatientSurgicalHistory = z.infer<typeof UpdatePatientSurgicalHistorySchema>;
