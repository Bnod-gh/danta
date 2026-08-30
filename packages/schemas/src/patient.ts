import { z } from 'zod';

export const PatientStatusSchema = z.enum(['active', 'inactive', 'deceased']);

export const PatientSchema = z.object({
  id: z.string().uuid(),
  tenantId: z.string().uuid(),
  patientNumber: z.string(),
  firstName: z.string(),
  lastName: z.string(),
  preferredName: z.string().optional(),
  dateOfBirth: z.date(),
  gender: z.string().optional(),
  email: z.string().optional(),
  phone: z.string().optional(),
  medicareNumber: z.string().optional(),
  healthFundName: z.string().optional(),
  healthFundNumber: z.string().optional(),
  healthFundMembershipNumber: z.string().optional(),
  doNotContact: z.boolean(),
  notes: z.string().optional(),
  nationalId: z.string().optional(),
  nationalIdType: z.string().optional(),
  profession: z.string().optional(),
  workplace: z.string().optional(),
  preferredLanguage: z.string().optional(),
  photoUrl: z.string().optional(),
  billingName: z.string().optional(),
  billingTaxId: z.string().optional(),
  billingAddress: z.unknown().optional(),
  billingEmail: z.string().optional(),
  status: PatientStatusSchema,
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type Patient = z.infer<typeof PatientSchema>;

export const NationalIdTypeSchema = z.enum(['medicare', 'passport', 'drivers_licence', 'other']);

export const CreatePatientSchema = z.object({
  firstName: z.string().min(1).max(100),
  lastName: z.string().min(1).max(100),
  preferredName: z.string().max(100).optional(),
  dateOfBirth: z.coerce.date(),
  gender: z.string().max(20).optional(),
  email: z.string().email().optional(),
  phone: z.string().max(32).optional(),
  medicareNumber: z.string().max(20).optional(),
  healthFundName: z.string().max(100).optional(),
  healthFundNumber: z.string().max(50).optional(),
  healthFundMembershipNumber: z.string().max(50).optional(),
  doNotContact: z.boolean().default(false),
  notes: z.string().max(2000).optional(),
  nationalId: z.string().max(50).optional(),
  nationalIdType: NationalIdTypeSchema.optional(),
  profession: z.string().max(100).optional(),
  workplace: z.string().max(200).optional(),
  preferredLanguage: z.string().max(10).optional(),
  photoUrl: z.string().url().max(500).optional(),
  billingName: z.string().max(200).optional(),
  billingTaxId: z.string().max(50).optional(),
  billingAddress: z.record(z.string(), z.unknown()).optional(),
  billingEmail: z.string().email().optional(),
});

export type CreatePatient = z.infer<typeof CreatePatientSchema>;

export const UpdatePatientSchema = CreatePatientSchema.partial();

export type UpdatePatient = z.infer<typeof UpdatePatientSchema>;

export const PatientQuerySchema = z.object({
  search: z.string().optional(),
  status: PatientStatusSchema.optional(),
  skip: z.coerce.number().int().nonnegative().optional(),
  take: z.coerce.number().int().positive().max(100).optional(),
});

export type PatientQuery = z.infer<typeof PatientQuerySchema>;

export const PatientsResponseSchema = z.array(PatientSchema);

export type PatientsResponse = z.infer<typeof PatientsResponseSchema>;
