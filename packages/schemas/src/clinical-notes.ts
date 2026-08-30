import { z } from 'zod';

export const ClinicalNoteTypeSchema = z.enum(['general', 'examination', 'procedure', 'referral']);

export const SoapSectionsSchema = z.object({
  subjective: z.string().max(4000).optional(),
  objective: z.string().max(4000).optional(),
  assessment: z.string().max(4000).optional(),
  plan: z.string().max(4000).optional(),
});

export type SoapSections = z.infer<typeof SoapSectionsSchema>;

export const ClinicalNoteSchema = z.object({
  id: z.string().uuid(),
  tenantId: z.string().uuid(),
  patientId: z.string().uuid(),
  appointmentId: z.string().uuid().optional(),
  providerId: z.string().uuid(),
  note: z.string(),
  subjective: z.string().optional(),
  objective: z.string().optional(),
  assessment: z.string().optional(),
  plan: z.string().optional(),
  aiSummary: z.string().optional(),
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
  subjective: z.string().max(4000).optional(),
  objective: z.string().max(4000).optional(),
  assessment: z.string().max(4000).optional(),
  plan: z.string().max(4000).optional(),
  aiSummary: z.string().max(2000).optional(),
  type: ClinicalNoteTypeSchema.default('general'),
});

export type CreateClinicalNote = z.infer<typeof CreateClinicalNoteSchema>;

export const UpdateClinicalNoteSchema = z.object({
  note: z.string().min(1).max(5000).optional(),
  subjective: z.string().max(4000).optional(),
  objective: z.string().max(4000).optional(),
  assessment: z.string().max(4000).optional(),
  plan: z.string().max(4000).optional(),
  aiSummary: z.string().max(2000).optional(),
  type: ClinicalNoteTypeSchema.optional(),
  signedAt: z.date().optional(),
  signedBy: z.string().optional(),
});

export type UpdateClinicalNote = z.infer<typeof UpdateClinicalNoteSchema>;

export const AiSynthesizeRequestSchema = z.object({
  chiefComplaint: z.string().min(1).max(500),
  rawDictation: z.string().max(8000).optional(),
  subjective: z.string().max(4000).optional(),
  objective: z.string().max(4000).optional(),
  assessment: z.string().max(4000).optional(),
  plan: z.string().max(4000).optional(),
});

export type AiSynthesizeRequest = z.infer<typeof AiSynthesizeRequestSchema>;

export const AiSynthesizedSoapSchema = z.object({
  subjective: z.string(),
  objective: z.string(),
  assessment: z.string(),
  plan: z.string(),
  generatedBy: z.enum(['ai', 'template']),
});

export type AiSynthesizedSoap = z.infer<typeof AiSynthesizedSoapSchema>;
