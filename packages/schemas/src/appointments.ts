import { z } from 'zod';

export const AppointmentStatusSchema = z.enum(['scheduled', 'confirmed', 'checked_in', 'in_progress', 'completed', 'cancelled', 'no_show']);

export const AppointmentSchema = z.object({
  id: z.string().uuid(),
  tenantId: z.string().uuid(),
  patientId: z.string().uuid(),
  providerId: z.string().uuid(),
  chairId: z.string().uuid(),
  appointmentTypeId: z.string().uuid(),
  startTime: z.date(),
  endTime: z.date(),
  status: AppointmentStatusSchema,
  notes: z.string().optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type Appointment = z.infer<typeof AppointmentSchema>;

export const CreateAppointmentSchema = z.object({
  patientId: z.string().uuid(),
  providerId: z.string().uuid(),
  chairId: z.string().uuid(),
  appointmentTypeId: z.string().uuid(),
  startTime: z.coerce.date(),
  endTime: z.coerce.date(),
  status: AppointmentStatusSchema.default('scheduled'),
  notes: z.string().max(1000).optional(),
});

export type CreateAppointment = z.infer<typeof CreateAppointmentSchema>;

export const UpdateAppointmentSchema = z.object({
  patientId: z.string().uuid().optional(),
  providerId: z.string().uuid().optional(),
  chairId: z.string().uuid().optional(),
  appointmentTypeId: z.string().uuid().optional(),
  startTime: z.coerce.date().optional(),
  endTime: z.coerce.date().optional(),
  status: AppointmentStatusSchema.optional(),
  notes: z.string().max(1000).optional(),
});

export type UpdateAppointment = z.infer<typeof UpdateAppointmentSchema>;

export const AppointmentQuerySchema = z.object({
  patientId: z.string().uuid().optional(),
  providerId: z.string().uuid().optional(),
  status: AppointmentStatusSchema.optional(),
  startFrom: z.coerce.date().optional(),
  startTo: z.coerce.date().optional(),
});

export type AppointmentQuery = z.infer<typeof AppointmentQuerySchema>;
