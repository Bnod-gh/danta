import { z } from 'zod';

export const RefundStatusSchema = z.enum(['pending', 'completed', 'failed']);

export const RefundSchema = z.object({
  id: z.string().uuid(),
  tenantId: z.string().uuid(),
  paymentId: z.string().uuid(),
  invoiceId: z.string().uuid().optional(),
  amount: z.number(),
  reason: z.string().optional(),
  status: RefundStatusSchema,
  processedAt: z.date().optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type Refund = z.infer<typeof RefundSchema>;

export const CreateRefundSchema = z.object({
  paymentId: z.string().uuid(),
  invoiceId: z.string().uuid().optional(),
  amount: z.number().positive(),
  reason: z.string().max(500).optional(),
});

export type CreateRefund = z.infer<typeof CreateRefundSchema>;

export const UpdateRefundSchema = z.object({
  status: RefundStatusSchema.optional(),
  processedAt: z.coerce.date().optional(),
});

export type UpdateRefund = z.infer<typeof UpdateRefundSchema>;

export const CreditNoteSchema = z.object({
  id: z.string().uuid(),
  tenantId: z.string().uuid(),
  invoiceId: z.string().uuid(),
  amount: z.number(),
  reason: z.string().optional(),
  appliedAt: z.date(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type CreditNote = z.infer<typeof CreditNoteSchema>;

export const CreateCreditNoteSchema = z.object({
  invoiceId: z.string().uuid(),
  amount: z.number().positive(),
  reason: z.string().max(500).optional(),
});

export type CreateCreditNote = z.infer<typeof CreateCreditNoteSchema>;
