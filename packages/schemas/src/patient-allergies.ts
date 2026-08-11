import { z } from 'zod';

export const AllergySeveritySchema = z.enum(['mild', 'moderate', 'severe']);

export const PatientAllergySchema = z.object({
  id: z.string().uuid(),
  tenantId: z.string().uuid(),
  patientId: z.string().uuid(),
  allergen: z.string(),
  severity: AllergySeveritySchema,
  reaction: z.string().optional(),
  isActive: z.boolean(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type PatientAllergy = z.infer<typeof PatientAllergySchema>;

export const CreatePatientAllergySchema = z.object({
  allergen: z.string().min(1).max(255),
  severity: AllergySeveritySchema.default('moderate'),
  reaction: z.string().max(1000).optional(),
  isActive: z.boolean().default(true),
});

export type CreatePatientAllergy = z.infer<typeof CreatePatientAllergySchema>;

export const UpdatePatientAllergySchema = CreatePatientAllergySchema.partial();

export type UpdatePatientAllergy = z.infer<typeof UpdatePatientAllergySchema>;
