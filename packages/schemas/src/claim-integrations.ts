import { z } from 'zod';

export const ClaimIntegrationSchema = z.object({
  id: z.string().uuid(),
  tenantId: z.string().uuid(),
  name: z.string(),
  provider: z.string(),
  isActive: z.boolean(),
  config: z.record(z.any()).optional(),
  credentialReference: z.string().optional(),
  healthStatus: z.string().optional(),
  lastSuccessfulOp: z.date().optional(),
  lastError: z.string().optional(),
  errorStatus: z.string().optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type ClaimIntegration = z.infer<typeof ClaimIntegrationSchema>;

export const CreateClaimIntegrationSchema = z.object({
  name: z.string().min(1).max(255),
  provider: z.string().min(1).max(100),
  isActive: z.boolean().default(true),
  config: z.record(z.any()).optional(),
  credentialReference: z.string().max(255).optional(),
});

export type CreateClaimIntegration = z.infer<typeof CreateClaimIntegrationSchema>;

export const UpdateClaimIntegrationSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  provider: z.string().min(1).max(100).optional(),
  isActive: z.boolean().optional(),
  config: z.record(z.any()).optional(),
  credentialReference: z.string().max(255).optional(),
  healthStatus: z.string().optional(),
  lastSuccessfulOp: z.coerce.date().optional(),
  lastError: z.string().max(1000).optional(),
  errorStatus: z.string().optional(),
});

export type UpdateClaimIntegration = z.infer<typeof UpdateClaimIntegrationSchema>;
