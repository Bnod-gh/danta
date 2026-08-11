import { z } from 'zod';

export const TemplateSchema = z.object({
  id: z.string().uuid(),
  tenantId: z.string().uuid(),
  name: z.string(),
  category: z.string(),
  content: z.string(),
  isActive: z.boolean(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type Template = z.infer<typeof TemplateSchema>;

export const CreateTemplateSchema = z.object({
  name: z.string().min(1).max(255),
  category: z.string().min(1).max(100),
  content: z.string().min(1).max(5000),
  isActive: z.boolean().default(true),
});

export type CreateTemplate = z.infer<typeof CreateTemplateSchema>;

export const UpdateTemplateSchema = CreateTemplateSchema.partial();

export type UpdateTemplate = z.infer<typeof UpdateTemplateSchema>;
