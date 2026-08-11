import { z } from 'zod';

export const PatientDocumentSchema = z.object({
  id: z.string().uuid(),
  tenantId: z.string().uuid(),
  patientId: z.string().uuid(),
  name: z.string(),
  mimeType: z.string(),
  size: z.number(),
  storageKey: z.string(),
  uploadedBy: z.string().optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type PatientDocument = z.infer<typeof PatientDocumentSchema>;

export const CreatePatientDocumentSchema = z.object({
  name: z.string().min(1).max(255),
  mimeType: z.string().min(1).max(100),
  size: z.number().positive(),
  storageKey: z.string().min(1).max(500),
  uploadedBy: z.string().max(255).optional(),
});

export type CreatePatientDocument = z.infer<typeof CreatePatientDocumentSchema>;

export const UpdatePatientDocumentSchema = z.object({
  name: z.string().min(1).max(255).optional(),
});

export type UpdatePatientDocument = z.infer<typeof UpdatePatientDocumentSchema>;
