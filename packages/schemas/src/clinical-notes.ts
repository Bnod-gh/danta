import { z } from 'zod';

export const ClinicalNoteTypeSchema = z.enum(['general', 'examination', 'procedure', 'referral']);

export const ClinicalNoteSchema = z.object({
  id: z.string().uuid(),
  tenantId: z.string().uuid(),
  patientId: z.string().uuid(),
  appointmentId: z.string().uuid().optional(),
  providerId: z.string().uuid(),
  note: z.string(),
  type: ClinicalNoteTypeSchema,
  signedAt: z.date().optional(),
  signedBy: z.string().optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type ClinicalNote = z.infer<typeof ClinicalNoteSchema>;

export const CreateClinicalNoteSchema = z.object({
  patientId: z.string().uuid(),
  appointmentId: z.string().uuid().optional(),
  providerId: z.string().uuid(),
  note: z.string().min(1).max(5000),
  type: ClinicalNoteTypeSchema.default('general'),
});

export type CreateClinicalNote = z.infer<typeof CreateClinicalNoteSchema>;

export const UpdateClinicalNoteSchema = z.object({
  note: z.string().min(1).max(5000).optional(),
  type: ClinicalNoteTypeSchema.optional(),
  signedAt: z.date().optional(),
  signedBy: z.string().optional(),
});

export type UpdateClinicalNote = z.infer<typeof UpdateClinicalNoteSchema>;
