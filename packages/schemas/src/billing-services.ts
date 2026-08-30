import { z } from 'zod';

export const ServiceSchema = z.object({
  id: z.string().uuid(),
  tenantId: z.string().uuid(),
  name: z.string(),
  code: z.string().optional(),
  description: z.string().optional(),
  category: z.string().optional(),
  isActive: z.boolean(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type Service = z.infer<typeof ServiceSchema>;

export const CreateServiceSchema = z.object({
  name: z.string().min(1).max(255),
  code: z.string().max(32).optional(),
  description: z.string().max(500).optional(),
  category: z.string().max(100).optional(),
});

export type CreateService = z.infer<typeof CreateServiceSchema>;

export const UpdateServiceSchema = CreateServiceSchema.partial();

export type UpdateService = z.infer<typeof UpdateServiceSchema>;

export const FeeScheduleSchema = z.object({
  id: z.string().uuid(),
  tenantId: z.string().uuid(),
  serviceId: z.string().uuid(),
  amount: z.number(),
  currency: z.string().default('AUD'),
  effectiveFrom: z.date(),
  effectiveTo: z.date().optional(),
  isActive: z.boolean(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type FeeSchedule = z.infer<typeof FeeScheduleSchema>;

export const CreateFeeScheduleSchema = z.object({
  serviceId: z.string().uuid(),
  amount: z.number().positive(),
  currency: z.string().default('AUD'),
  effectiveFrom: z.coerce.date(),
  effectiveTo: z.coerce.date().optional(),
});

export type CreateFeeSchedule = z.infer<typeof CreateFeeScheduleSchema>;

export const UpdateFeeScheduleSchema = z.object({
  amount: z.number().positive().optional(),
  currency: z.string().optional(),
  effectiveFrom: z.coerce.date().optional(),
  effectiveTo: z.coerce.date().optional(),
  isActive: z.boolean().optional(),
});

export type UpdateFeeSchedule = z.infer<typeof UpdateFeeScheduleSchema>;
