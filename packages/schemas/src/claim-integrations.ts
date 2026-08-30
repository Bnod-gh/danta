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

export const ClaimItemSchema = z.object({
  itemNumber: z.string(),
  itemCode: z.string(),
  description: z.string(),
  quantity: z.number().int().positive(),
  unitPrice: z.number().nonnegative(),
  total: z.number().nonnegative(),
  toothNumber: z.string().optional(),
  itemType: z.string().optional(),
});

export type ClaimItem = z.infer<typeof ClaimItemSchema>;

export const SubmitClaimSchema = z.object({
  patientId: z.string().uuid(),
  appointmentId: z.string().uuid().optional(),
  items: z.array(ClaimItemSchema).min(1),
  providerId: z.string().uuid(),
  locationId: z.string().uuid(),
  serviceDate: z.string().datetime(),
  claimType: z.enum(['general', 'dental', 'hospital', 'allied_health']),
  referralNumber: z.string().optional(),
  invoiceId: z.string().uuid().optional(),
  notes: z.string().max(2000).optional(),
});

export type SubmitClaim = z.infer<typeof SubmitClaimSchema>;

export const ClaimStatusSchema = z.object({
  externalClaimId: z.string(),
  status: z.enum(['pending', 'accepted', 'rejected', 'paid', 'partially_paid', 'requires_review', 'cancelled']),
  amount: z.number().nonnegative(),
  paidAmount: z.number().nonnegative().optional(),
  processedAt: z.string().datetime().optional(),
  rejectionReason: z.string().optional(),
  providerReference: z.string().optional(),
});

export type ClaimStatus = z.infer<typeof ClaimStatusSchema>;

export const PaymentResponseSchema = z.object({
  externalPaymentId: z.string(),
  amount: z.number().nonnegative(),
  paymentMethod: z.string(),
  paidAt: z.string().datetime(),
  reference: z.string().optional(),
  allocations: z.array(z.object({
    claimId: z.string(),
    amount: z.number().nonnegative(),
  })),
});

export type PaymentResponse = z.infer<typeof PaymentResponseSchema>;

export const ReconciliationResultSchema = z.object({
  startDate: z.string().datetime(),
  endDate: z.string().datetime(),
  totalClaims: z.number().int().nonnegative(),
  matchedClaims: z.number().int().nonnegative(),
  unmatchedClaims: z.number().int().nonnegative(),
  discrepancies: z.array(z.object({
    externalClaimId: z.string(),
    field: z.string(),
    expected: z.any(),
    actual: z.any(),
  })),
  generatedAt: z.string().datetime(),
});

export type ReconciliationResult = z.infer<typeof ReconciliationResultSchema>;

export const ClaimStatusHistorySchema = z.object({
  id: z.string().uuid(),
  integrationId: z.string().uuid(),
  externalClaimId: z.string(),
  status: z.string(),
  amount: z.number().nonnegative(),
  paidAmount: z.number().nonnegative().optional(),
  processedAt: z.string().datetime().optional(),
  rejectionReason: z.string().optional(),
  providerReference: z.string().optional(),
  rawResponse: z.record(z.any()).optional(),
  createdAt: z.date(),
});

export type ClaimStatusHistory = z.infer<typeof ClaimStatusHistorySchema>;
