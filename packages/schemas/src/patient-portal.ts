import { z } from 'zod';

export const PatientLoginSchema = z.object({
  tenantId: z.string().uuid(),
  email: z.string().email().optional(),
  phone: z.string().max(32).optional(),
  password: z.string().min(1).max(128),
});

export type PatientLogin = z.infer<typeof PatientLoginSchema>;

export const PatientRegisterSchema = z.object({
  tenantId: z.string().uuid(),
  email: z.string().email(),
  phone: z.string().max(32).optional(),
  password: z.string().min(8).max(128),
  firstName: z.string().min(1).max(100),
  lastName: z.string().min(1).max(100),
  dateOfBirth: z.coerce.date().refine((d) => !isNaN(d.getTime()), {
    message: 'Invalid date',
  }),
}).refine((value) => Boolean(value.email || value.phone), {
  message: 'Email or phone is required',
  path: ['email'],
});

export const PatientPortalProfileUpdateSchema = z.object({
  firstName: z.string().min(1).max(100).optional(),
  lastName: z.string().min(1).max(100).optional(),
  preferredName: z.string().max(100).optional(),
  dateOfBirth: z.coerce.date().optional(),
  gender: z.string().max(20).optional(),
  email: z.string().email().optional(),
  phone: z.string().max(32).optional(),
}).strict();

export type PatientPortalProfileUpdate = z.infer<typeof PatientPortalProfileUpdateSchema>;

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
