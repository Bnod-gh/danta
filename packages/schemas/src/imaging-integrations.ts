import { z } from 'zod';

export const ImagingIntegrationSchema = z.object({
  id: z.string().uuid(),
  tenantId: z.string().uuid(),
  name: z.string(),
  provider: z.string(),
  isActive: z.boolean(),
  config: z.record(z.any()).optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type ImagingIntegration = z.infer<typeof ImagingIntegrationSchema>;

export const CreateImagingIntegrationSchema = z.object({
  name: z.string().min(1).max(255),
  provider: z.string().min(1).max(100),
  isActive: z.boolean().default(true),
  config: z.record(z.any()).optional(),
});

export type CreateImagingIntegration = z.infer<typeof CreateImagingIntegrationSchema>;

export const UpdateImagingIntegrationSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  provider: z.string().min(1).max(100).optional(),
  isActive: z.boolean().optional(),
  config: z.record(z.any()).optional(),
});

export type UpdateImagingIntegration = z.infer<typeof UpdateImagingIntegrationSchema>;
