import { z } from 'zod';

export const ReminderStatusSchema = z.enum(['scheduled', 'sent', 'delivered', 'failed', 'cancelled']);

export const AppointmentReminderSchema = z.object({
  id: z.string().uuid(),
  tenantId: z.string().uuid(),
  appointmentId: z.string().uuid(),
  channel: z.enum(['sms', 'email', 'in_app', 'patient_portal']),
  status: ReminderStatusSchema,
  scheduledAt: z.date(),
  sentAt: z.date().optional(),
  deliveredAt: z.date().optional(),
  error: z.string().optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type AppointmentReminder = z.infer<typeof AppointmentReminderSchema>;

export const CreateAppointmentReminderSchema = z.object({
  appointmentId: z.string().uuid(),
  channel: z.enum(['sms', 'email', 'in_app', 'patient_portal']),
  scheduledAt: z.coerce.date(),
});

export type CreateAppointmentReminder = z.infer<typeof CreateAppointmentReminderSchema>;

export const UpdateAppointmentReminderSchema = z.object({
  status: ReminderStatusSchema.optional(),
  scheduledAt: z.coerce.date().optional(),
  error: z.string().max(1000).optional(),
});

export type UpdateAppointmentReminder = z.infer<typeof UpdateAppointmentReminderSchema>;
