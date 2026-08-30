import { z } from 'zod';

export const WaitlistStatusSchema = z.enum(['waiting', 'booked', 'cancelled']);

export const WaitlistSchema = z.object({
  id: z.string().uuid(),
  tenantId: z.string().uuid(),
  patientId: z.string().uuid(),
  providerId: z.string().uuid().optional(),
  chairId: z.string().uuid().optional(),
  appointmentTypeId: z.string().uuid().optional(),
  preferredStartTime: z.date(),
  preferredEndTime: z.date(),
  status: WaitlistStatusSchema,
  notes: z.string().optional(),
  bookedAppointmentId: z.string().uuid().optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type Waitlist = z.infer<typeof WaitlistSchema>;

export const CreateWaitlistSchema = z.object({
  patientId: z.string().uuid(),
  providerId: z.string().uuid().optional(),
  chairId: z.string().uuid().optional(),
  appointmentTypeId: z.string().uuid().optional(),
  preferredStartTime: z.coerce.date(),
  preferredEndTime: z.coerce.date(),
  notes: z.string().max(1000).optional(),
});

export type CreateWaitlist = z.infer<typeof CreateWaitlistSchema>;

export const UpdateWaitlistSchema = z.object({
  patientId: z.string().uuid().optional(),
  providerId: z.string().uuid().optional(),
  chairId: z.string().uuid().optional(),
  appointmentTypeId: z.string().uuid().optional(),
  preferredStartTime: z.coerce.date().optional(),
  preferredEndTime: z.coerce.date().optional(),
  status: WaitlistStatusSchema.optional(),
  notes: z.string().max(1000).optional(),
});

export type UpdateWaitlist = z.infer<typeof UpdateWaitlistSchema>;

export const WaitlistQuerySchema = z.object({
  patientId: z.string().uuid().optional(),
  providerId: z.string().uuid().optional(),
  status: WaitlistStatusSchema.optional(),
});

export type WaitlistQuery = z.infer<typeof WaitlistQuerySchema>;
