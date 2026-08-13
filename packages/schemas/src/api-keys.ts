import { z } from 'zod';

export const ApiKeyCreateSchema = z.object({
  name: z.string().min(1).max(255),
  scopes: z.array(z.string()).default([]),
  expiresAt: z.coerce.date().optional(),
  ipAllowlist: z.array(z.string().refine((val) => val.includes('/'), { message: 'Invalid CIDR format' })).optional(),
});

export type ApiKeyCreate = z.infer<typeof ApiKeyCreateSchema>;

export const ApiKeyResponseSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  keyPrefix: z.string(),
  env: z.enum(['DEV', 'STAGING', 'PROD']),
  version: z.number().int().positive(),
  scopes: z.array(z.string()),
  rateLimit: z.union([z.object({ max: z.number().int().positive(), windowMs: z.number().int().positive() }), z.null()]).optional(),
  ipAllowlist: z.array(z.string()).optional(),
  lastUsedAt: z.date().optional(),
  expiresAt: z.date().optional(),
  revokedAt: z.date().optional(),
  createdAt: z.date(),
});

export type ApiKeyResponse = z.infer<typeof ApiKeyResponseSchema>;

export const ApiKeyCreateResponseSchema = ApiKeyResponseSchema.extend({
  secret: z.string(),
});

export type ApiKeyCreateResponse = z.infer<typeof ApiKeyCreateResponseSchema>;

export const ApiKeyRotateResponseSchema = ApiKeyCreateResponseSchema;

export type ApiKeyRotateResponse = z.infer<typeof ApiKeyRotateResponseSchema>;
