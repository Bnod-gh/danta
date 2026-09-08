import { z } from 'zod';
import { ToothSurfaceSchema } from './dental-charting';

export const ToothConditionConfigSchema = z.object({
  id: z.string().uuid(),
  tenantId: z.string().uuid(),
  code: z.string().max(50),
  name: z.string().max(255),
  category: z.string().max(50).default('general'),
  color: z.string().max(7).default('#3b82f6'),
  surfaces: z.array(ToothSurfaceSchema).default([]),
  cdtCode: z.string().max(20).nullable().optional(),
  cdtDescription: z.string().max(255).nullable().optional(),
  cdtFee: z.number().nullable().optional(),
  icon: z.string().max(50).nullable().optional(),
  order: z.number().int().default(0),
  active: z.boolean().default(true),
  isSystem: z.boolean().default(false),
  createdAt: z.date(),
  updatedAt: z.date(),
});
export type ToothConditionConfig = z.infer<typeof ToothConditionConfigSchema>;

export const CreateToothConditionConfigSchema = z.object({
  code: z.string().min(1).max(50),
  name: z.string().min(1).max(255),
  category: z.string().max(50).default('general'),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/, 'Must be a valid hex color like #3b82f6').default('#3b82f6'),
  surfaces: z.array(ToothSurfaceSchema).default([]),
  cdtCode: z.string().max(20).optional(),
  cdtDescription: z.string().max(255).optional(),
  cdtFee: z.number().min(0).optional(),
  icon: z.string().max(50).optional(),
  order: z.number().int().default(0),
  active: z.boolean().default(true),
  isSystem: z.boolean().default(false),
});
export type CreateToothConditionConfig = z.infer<typeof CreateToothConditionConfigSchema>;

export const UpdateToothConditionConfigSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  category: z.string().max(50).optional(),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/, 'Must be a valid hex color like #3b82f6').optional(),
  surfaces: z.array(ToothSurfaceSchema).optional(),
  cdtCode: z.string().max(20).nullable().optional(),
  cdtDescription: z.string().max(255).nullable().optional(),
  cdtFee: z.number().min(0).nullable().optional(),
  icon: z.string().max(50).nullable().optional(),
  order: z.number().int().optional(),
  active: z.boolean().optional(),
});
export type UpdateToothConditionConfig = z.infer<typeof UpdateToothConditionConfigSchema>;
