import { z } from 'zod';

export const NotificationTypeSchema = z.enum(['appointment', 'recall', 'billing', 'clinical', 'system']);

export const NotificationSchema = z.object({
  id: z.string().uuid(),
  tenantId: z.string().uuid(),
  patientId: z.string().uuid().optional(),
  userId: z.string().uuid().optional(),
  type: NotificationTypeSchema,
  title: z.string(),
  message: z.string(),
  data: z.record(z.any()).optional(),
  readAt: z.date().optional(),
  createdAt: z.date(),
});

export type Notification = z.infer<typeof NotificationSchema>;

export const CreateNotificationSchema = z.object({
  patientId: z.string().uuid().optional(),
  userId: z.string().uuid().optional(),
  type: NotificationTypeSchema,
  title: z.string().min(1).max(255),
  message: z.string().min(1).max(1000),
  data: z.record(z.any()).optional(),
});

export type CreateNotification = z.infer<typeof CreateNotificationSchema>;

export const NotificationQuerySchema = z.object({
  patientId: z.string().uuid().optional(),
  userId: z.string().uuid().optional(),
  type: NotificationTypeSchema.optional(),
  read: z.coerce.boolean().optional(),
});

export type NotificationQuery = z.infer<typeof NotificationQuerySchema>;
