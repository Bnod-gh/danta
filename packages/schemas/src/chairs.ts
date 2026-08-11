import { z } from 'zod';

export const ChairSchema = z.object({
  id: z.string().uuid(),
  tenantId: z.string().uuid(),
  locationId: z.string().uuid().optional(),
  name: z.string(),
  isActive: z.boolean(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type Chair = z.infer<typeof ChairSchema>;

export const CreateChairSchema = z.object({
  locationId: z.string().uuid().optional(),
  name: z.string().min(1).max(255),
  isActive: z.boolean().default(true),
});

export type CreateChair = z.infer<typeof CreateChairSchema>;

export const UpdateChairSchema = CreateChairSchema.partial();

export type UpdateChair = z.infer<typeof UpdateChairSchema>;
