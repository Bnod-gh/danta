import { z } from 'zod';

export const InsuranceClaimStatusSchema = z.enum(['draft', 'submitted', 'in_review', 'paid', 'partially_paid', 'denied', 'cancelled']);
export type InsuranceClaimStatus = z.infer<typeof InsuranceClaimStatusSchema>;

export const InsuranceClaimSchema = z.object({
  id: z.string().uuid(),
  tenantId: z.string().uuid(),
  invoiceId: z.string().uuid().optional(),
  patientId: z.string().uuid(),
  integrationId: z.string().uuid().optional(),
  claimNumber: z.string(),
  externalClaimId: z.string().optional(),
  status: InsuranceClaimStatusSchema,
  amount: z.number(),
  paidAmount: z.number().optional(),
  submittedAt: z.date().optional(),
  processedAt: z.date().optional(),
  rejectionReason: z.string().optional(),
  providerReference: z.string().optional(),
  notes: z.string().optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type InsuranceClaim = z.infer<typeof InsuranceClaimSchema>;

export const CreateClaimSchema = z.object({
  invoiceId: z.string().uuid(),
  integrationId: z.string().uuid().optional(),
  notes: z.string().max(1000).optional(),
});

export type CreateClaim = z.infer<typeof CreateClaimSchema>;

export const UpdateClaimStatusSchema = z.object({
  status: InsuranceClaimStatusSchema,
  paidAmount: z.number().nonnegative().optional(),
  rejectionReason: z.string().max(500).optional(),
  providerReference: z.string().max(128).optional(),
  note: z.string().max(500).optional(),
});

export type UpdateClaimStatus = z.infer<typeof UpdateClaimStatusSchema>;

export const ClaimQuerySchema = z.object({
  status: InsuranceClaimStatusSchema.optional(),
  patientId: z.string().uuid().optional(),
  invoiceId: z.string().uuid().optional(),
});

export type ClaimQuery = z.infer<typeof ClaimQuerySchema>;

export const ClaimHistoryItemSchema = z.object({
  id: z.string().uuid(),
  claimId: z.string().uuid(),
  status: InsuranceClaimStatusSchema,
  note: z.string().optional(),
  createdAt: z.date(),
});

export type ClaimHistoryItem = z.infer<typeof ClaimHistoryItemSchema>;

/** Statuses a claim may move to given its current lifecycle stage (mirrors service guards). */
export function allowedClaimTransitions(status: InsuranceClaimStatus): InsuranceClaimStatus[] {
  switch (status) {
    case 'draft':
      return ['submitted', 'cancelled'];
    case 'submitted':
      return ['in_review', 'paid', 'partially_paid', 'denied'];
    case 'in_review':
      return ['paid', 'partially_paid', 'denied'];
    case 'denied':
      return ['submitted'];
    case 'partially_paid':
      return ['paid'];
    default:
      return [];
  }
}
