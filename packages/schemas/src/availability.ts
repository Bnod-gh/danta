import { z } from 'zod';

export const AvailabilitySchema = z.object({
  id: z.string().uuid(),
  tenantId: z.string().uuid(),
  providerId: z.string().uuid(),
  dayOfWeek: z.number(),
  startTime: z.string(),
  endTime: z.string(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type Availability = z.infer<typeof AvailabilitySchema>;

export const CreateAvailabilitySchema = z.object({
  providerId: z.string().uuid(),
  dayOfWeek: z.number().int().min(0).max(6),
  startTime: z.string().regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/),
  endTime: z.string().regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/),
});

export type CreateAvailability = z.infer<typeof CreateAvailabilitySchema>;

export const UpdateAvailabilitySchema = CreateAvailabilitySchema.partial();

export type UpdateAvailability = z.infer<typeof UpdateAvailabilitySchema>;
