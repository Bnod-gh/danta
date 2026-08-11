import { z } from 'zod';

export const PatientLoginSchema = z.object({
  tenantId: z.string().uuid(),
  email: z.string().email().optional(),
  phone: z.string().max(32).optional(),
  password: z.string().min(1).max(128),
});

export type PatientLogin = z.infer<typeof PatientLoginSchema>;

export const PatientRegisterSchema = z.object({
  email: z.string().email().optional(),
  phone: z.string().max(32).optional(),
  password: z.string().min(8).max(128),
  firstName: z.string().min(1).max(100),
  lastName: z.string().min(1).max(100),
  dateOfBirth: z.coerce.date(),
  tenantId: z.string().uuid(),
});

export type PatientRegister = z.infer<typeof PatientRegisterSchema>;

export const PatientPortalTokenSchema = z.object({
  accessToken: z.string(),
  refreshToken: z.string(),
  patient: z.object({
    id: z.string().uuid(),
    tenantId: z.string().uuid(),
    patientNumber: z.string(),
    firstName: z.string(),
    lastName: z.string(),
    preferredName: z.string().optional(),
    email: z.string().optional(),
    phone: z.string().optional(),
  }),
});

export type PatientPortalToken = z.infer<typeof PatientPortalTokenSchema>;
