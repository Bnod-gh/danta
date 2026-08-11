import { z } from 'zod';

export const PatientContactTypeSchema = z.enum(['emergency', 'gp', 'referrer', 'guardian', 'other']);

export const PatientContactSchema = z.object({
  id: z.string().uuid(),
  tenantId: z.string().uuid(),
  patientId: z.string().uuid(),
  type: PatientContactTypeSchema,
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().optional(),
  relationship: z.string().optional(),
  isEmergency: z.boolean(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type PatientContact = z.infer<typeof PatientContactSchema>;

export const CreatePatientContactSchema = z.object({
  type: PatientContactTypeSchema.default('other'),
  firstName: z.string().max(100).optional(),
  lastName: z.string().max(100).optional(),
  phone: z.string().max(32).optional(),
  email: z.string().email().optional(),
  relationship: z.string().max(100).optional(),
  isEmergency: z.boolean().default(false),
});

export type CreatePatientContact = z.infer<typeof CreatePatientContactSchema>;

export const UpdatePatientContactSchema = CreatePatientContactSchema.partial();

export type UpdatePatientContact = z.infer<typeof UpdatePatientContactSchema>;
