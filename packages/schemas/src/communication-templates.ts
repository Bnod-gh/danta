import { z } from 'zod';

export const MessageChannelSchema = z.enum(['sms', 'email', 'in_app', 'patient_portal']);

export const CommunicationTemplateSchema = z.object({
  id: z.string().uuid(),
  tenantId: z.string().uuid(),
  name: z.string(),
  category: z.string(),
  channel: MessageChannelSchema,
  subject: z.string().optional(),
  body: z.string(),
  variables: z.record(z.any()).optional(),
  isActive: z.boolean(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type CommunicationTemplate = z.infer<typeof CommunicationTemplateSchema>;

export const CreateCommunicationTemplateSchema = z.object({
  name: z.string().min(1).max(255),
  category: z.string().min(1).max(100),
  channel: MessageChannelSchema,
  subject: z.string().max(255).optional(),
  body: z.string().min(1).max(5000),
  variables: z.record(z.any()).optional(),
});

export type CreateCommunicationTemplate = z.infer<typeof CreateCommunicationTemplateSchema>;

export const UpdateCommunicationTemplateSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  category: z.string().min(1).max(100).optional(),
  channel: MessageChannelSchema.optional(),
  subject: z.string().max(255).optional(),
  body: z.string().min(1).max(5000).optional(),
  variables: z.record(z.any()).optional(),
  isActive: z.boolean().optional(),
});

export type UpdateCommunicationTemplate = z.infer<typeof UpdateCommunicationTemplateSchema>;
