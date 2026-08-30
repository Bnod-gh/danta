import { z } from 'zod';

export const ChairSchema = z.object({
  id: z.string().uuid(),
  tenantId: z.string().uuid(),
  locationId: z.string().uuid().optional(),
  name: z.string(),
  description: z.string().optional(),
  isActive: z.boolean(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type Chair = z.infer<typeof ChairSchema>;

export const CreateChairSchema = z.object({
  locationId: z.string().uuid().optional(),
  name: z.string().min(1).max(255),
  description: z.string().max(255).optional(),
  isActive: z.boolean().default(true),
});

export type CreateChair = z.infer<typeof CreateChairSchema>;

export const UpdateChairSchema = CreateChairSchema.partial();

export type UpdateChair = z.infer<typeof UpdateChairSchema>;

export const LiveAppointmentSchema = z.object({
  appointmentId: z.string().uuid(),
  patientId: z.string().uuid(),
  patientName: z.string(),
  patientNumber: z.string().optional(),
  providerName: z.string(),
  procedureName: z.string(),
  procedureCode: z.string().nullable().optional(),
  startTime: z.date(),
  endTime: z.date(),
  status: z.string(),
  scheduledPrice: z.number().nullable().optional(),
});

export type LiveAppointment = z.infer<typeof LiveAppointmentSchema>;

export const ChairLiveStatusSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  description: z.string().nullable().optional(),
  locationId: z.string().uuid().nullable().optional(),
  isActive: z.boolean(),
  currentAppointment: LiveAppointmentSchema.nullable(),
  nextAppointment: LiveAppointmentSchema.nullable(),
});

export type ChairLiveStatus = z.infer<typeof ChairLiveStatusSchema>;
