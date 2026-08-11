import { z } from 'zod';

export const AlertTypeSchema = z.enum(['medical', 'dental', 'administrative']);
export const AlertSeveritySchema = z.enum(['info', 'warning', 'critical']);

export const PatientAlertSchema = z.object({
  id: z.string().uuid(),
  tenantId: z.string().uuid(),
  patientId: z.string().uuid(),
  type: AlertTypeSchema,
  severity: AlertSeveritySchema,
  message: z.string(),
  isActive: z.boolean(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type PatientAlert = z.infer<typeof PatientAlertSchema>;

export const CreatePatientAlertSchema = z.object({
  type: AlertTypeSchema.default('medical'),
  severity: AlertSeveritySchema.default('warning'),
  message: z.string().min(1).max(500),
  isActive: z.boolean().default(true),
});

export type CreatePatientAlert = z.infer<typeof CreatePatientAlertSchema>;

export const UpdatePatientAlertSchema = CreatePatientAlertSchema.partial();

export type UpdatePatientAlert = z.infer<typeof UpdatePatientAlertSchema>;
