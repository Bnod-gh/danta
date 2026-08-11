import { z } from 'zod';

export const ImagingImageTypeSchema = z.enum(['original', 'processed', 'thumbnail', 'dicom']);

export const ImagingImageSchema = z.object({
  id: z.string().uuid(),
  tenantId: z.string().uuid(),
  imagingStudyId: z.string().uuid(),
  toothNumber: z.string().optional(),
  imageType: ImagingImageTypeSchema,
  fileName: z.string(),
  mimeType: z.string(),
  size: z.number(),
  storageKey: z.string(),
  url: z.string().optional(),
  metadata: z.record(z.any()).optional(),
  uploadedBy: z.string().optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type ImagingImage = z.infer<typeof ImagingImageSchema>;

export const CreateImagingImageSchema = z.object({
  imagingStudyId: z.string().uuid(),
  toothNumber: z.string().min(1).max(10).optional(),
  imageType: ImagingImageTypeSchema.default('original'),
  fileName: z.string().min(1).max(255),
  mimeType: z.string().min(1).max(100),
  size: z.number().positive(),
  storageKey: z.string().min(1).max(500),
  url: z.string().max(1000).optional(),
  metadata: z.record(z.any()).optional(),
  uploadedBy: z.string().max(255).optional(),
});

export type CreateImagingImage = z.infer<typeof CreateImagingImageSchema>;

export const UpdateImagingImageSchema = z.object({
  toothNumber: z.string().min(1).max(10).optional(),
  imageType: ImagingImageTypeSchema.optional(),
  fileName: z.string().min(1).max(255).optional(),
  url: z.string().max(1000).optional(),
  metadata: z.record(z.any()).optional(),
});

export type UpdateImagingImage = z.infer<typeof UpdateImagingImageSchema>;
