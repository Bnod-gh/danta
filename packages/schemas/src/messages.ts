import { z } from 'zod';

export const MessageStatusSchema = z.enum(['pending', 'sent', 'delivered', 'failed', 'read']);

export const MessageSchema = z.object({
  id: z.string().uuid(),
  tenantId: z.string().uuid(),
  patientId: z.string().uuid().optional(),
  channel: z.enum(['sms', 'email', 'in_app', 'patient_portal']),
  status: MessageStatusSchema,
  subject: z.string().optional(),
  body: z.string(),
  recipient: z.string(),
  provider: z.string().optional(),
  externalId: z.string().optional(),
  error: z.string().optional(),
  sentAt: z.date().optional(),
  deliveredAt: z.date().optional(),
  readAt: z.date().optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type Message = z.infer<typeof MessageSchema>;

export const CreateMessageSchema = z.object({
  patientId: z.string().uuid().optional(),
  channel: z.enum(['sms', 'email', 'in_app', 'patient_portal']),
  subject: z.string().max(255).optional(),
  body: z.string().min(1).max(5000),
  recipient: z.string().min(1).max(255),
  provider: z.string().max(100).optional(),
});

export type CreateMessage = z.infer<typeof CreateMessageSchema>;

export const UpdateMessageSchema = z.object({
  status: MessageStatusSchema.optional(),
  provider: z.string().max(100).optional(),
  externalId: z.string().max(255).optional(),
  error: z.string().max(1000).optional(),
  sentAt: z.coerce.date().optional(),
  deliveredAt: z.coerce.date().optional(),
  readAt: z.coerce.date().optional(),
});

export type UpdateMessage = z.infer<typeof UpdateMessageSchema>;

export const MessageQuerySchema = z.object({
  patientId: z.string().uuid().optional(),
  channel: z.enum(['sms', 'email', 'in_app', 'patient_portal']).optional(),
  status: MessageStatusSchema.optional(),
});

export type MessageQuery = z.infer<typeof MessageQuerySchema>;
