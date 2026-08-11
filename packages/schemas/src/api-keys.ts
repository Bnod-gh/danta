import { z } from 'zod';

export const ApiKeyCreateSchema = z.object({
  name: z.string().min(1).max(255),
  scopes: z.array(z.string()).default([]),
  expiresAt: z.coerce.date().optional(),
});

export type ApiKeyCreate = z.infer<typeof ApiKeyCreateSchema>;

export const ApiKeyResponseSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  keyPrefix: z.string(),
  scopes: z.array(z.string()),
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
