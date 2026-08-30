import { z } from 'zod';

export const ImagingModalitySchema = z.enum(['xray', 'bitewing', 'periapical', 'ct', 'mri', 'panoramic', 'cbct', 'intraoral', 'extraoral', 'other']);

export const ImagingStudyStatusSchema = z.enum(['pending', 'in_progress', 'completed', 'cancelled']);

export const ImagingStudySchema = z.object({
  id: z.string().uuid(),
  tenantId: z.string().uuid(),
  patientId: z.string().uuid(),
  providerId: z.string().uuid(),
  appointmentId: z.string().uuid().optional(),
  studyDate: z.date(),
  modality: z.string(),
  description: z.string().optional(),
  status: ImagingStudyStatusSchema,
  storageProvider: z.string(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type ImagingStudy = z.infer<typeof ImagingStudySchema>;

export const CreateImagingStudySchema = z.object({
  patientId: z.string().uuid(),
  providerId: z.string().uuid(),
  appointmentId: z.string().uuid().optional(),
  studyDate: z.coerce.date(),
  modality: ImagingModalitySchema,
  description: z.string().max(500).optional(),
  status: ImagingStudyStatusSchema.default('pending'),
  storageProvider: z.string().default('local'),
});

export type CreateImagingStudy = z.infer<typeof CreateImagingStudySchema>;

export const UpdateImagingStudySchema = z.object({
  patientId: z.string().uuid().optional(),
  providerId: z.string().uuid().optional(),
  appointmentId: z.string().uuid().optional(),
  studyDate: z.coerce.date().optional(),
  modality: ImagingModalitySchema.optional(),
  description: z.string().max(500).optional(),
  status: ImagingStudyStatusSchema.optional(),
  storageProvider: z.string().optional(),
});

export type UpdateImagingStudy = z.infer<typeof UpdateImagingStudySchema>;

export const ImagingStudyQuerySchema = z.object({
  patientId: z.string().uuid().optional(),
  providerId: z.string().uuid().optional(),
  modality: ImagingModalitySchema.optional(),
  status: ImagingStudyStatusSchema.optional(),
  startFrom: z.coerce.date().optional(),
  startTo: z.coerce.date().optional(),
});

export type ImagingStudyQuery = z.infer<typeof ImagingStudyQuerySchema>;
