import { z } from 'zod';

export const PatientLegalGuardianSchema = z.object({
  id: z.string().uuid(),
  tenantId: z.string().uuid(),
  patientId: z.string().uuid(),
  name: z.string(),
  relationship: z.string(),
  nationalId: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().optional(),
  address: z.string().optional(),
  notes: z.string().optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type PatientLegalGuardian = z.infer<typeof PatientLegalGuardianSchema>;

export const UpsertPatientGuardianSchema = z.object({
  name: z.string().min(1).max(100),
  relationship: z.string().min(1).max(50),
  nationalId: z.string().max(20).optional(),
  phone: z.string().max(32).optional(),
  email: z.string().email().optional(),
  address: z.string().max(200).optional(),
  notes: z.string().max(500).optional(),
});

export type UpsertPatientGuardian = z.infer<typeof UpsertPatientGuardianSchema>;
