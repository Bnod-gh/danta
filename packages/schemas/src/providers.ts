import { z } from 'zod';

export const ProviderSchema = z.object({
  id: z.string().uuid(),
  tenantId: z.string().uuid(),
  userId: z.string().uuid(),
  firstName: z.string(),
  lastName: z.string(),
  email: z.string().optional(),
  phone: z.string().optional(),
  color: z.string().optional(),
  isActive: z.boolean(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type Provider = z.infer<typeof ProviderSchema>;

export const CreateProviderSchema = z.object({
  userId: z.string().uuid(),
  firstName: z.string().min(1).max(100),
  lastName: z.string().min(1).max(100),
  email: z.string().email().max(255).optional(),
  phone: z.string().max(32).optional(),
  color: z.string().max(7).optional(),
  isActive: z.boolean().default(true),
});

export type CreateProvider = z.infer<typeof CreateProviderSchema>;

export const UpdateProviderSchema = CreateProviderSchema.partial();

export type UpdateProvider = z.infer<typeof UpdateProviderSchema>;
