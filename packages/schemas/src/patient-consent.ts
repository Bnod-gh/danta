import { z } from 'zod';

export const ConsentTypeSchema = z.enum(['treatment', 'privacy', 'marketing', 'research']);

export const PatientConsentSchema = z.object({
  id: z.string().uuid(),
  tenantId: z.string().uuid(),
  patientId: z.string().uuid(),
  type: ConsentTypeSchema,
  grantedAt: z.date(),
  expiresAt: z.date().optional(),
  grantedBy: z.string().optional(),
  notes: z.string().optional(),
  isActive: z.boolean(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type PatientConsent = z.infer<typeof PatientConsentSchema>;

export const CreatePatientConsentSchema = z.object({
  type: ConsentTypeSchema.default('treatment'),
  expiresAt: z.coerce.date().optional(),
  grantedBy: z.string().max(255).optional(),
  notes: z.string().max(1000).optional(),
  isActive: z.boolean().default(true),
});

export type CreatePatientConsent = z.infer<typeof CreatePatientConsentSchema>;

export const UpdatePatientConsentSchema = CreatePatientConsentSchema.partial();

export type UpdatePatientConsent = z.infer<typeof UpdatePatientConsentSchema>;
