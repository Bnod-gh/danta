import { z } from 'zod';

export const AppointmentTypeSchema = z.object({
  id: z.string().uuid(),
  tenantId: z.string().uuid(),
  name: z.string(),
  code: z.string().optional(),
  description: z.string().optional(),
  duration: z.number(),
  color: z.string().optional(),
  isActive: z.boolean(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type AppointmentType = z.infer<typeof AppointmentTypeSchema>;

export const CreateAppointmentTypeSchema = z.object({
  name: z.string().min(1).max(255),
  code: z.string().max(32).optional(),
  description: z.string().max(500).optional(),
  duration: z.number().int().positive(),
  color: z.string().max(7).optional(),
  isActive: z.boolean().default(true),
});

export type CreateAppointmentType = z.infer<typeof CreateAppointmentTypeSchema>;

export const UpdateAppointmentTypeSchema = CreateAppointmentTypeSchema.partial();

export type UpdateAppointmentType = z.infer<typeof UpdateAppointmentTypeSchema>;
