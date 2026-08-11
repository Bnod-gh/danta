import { z } from 'zod';

export const PaymentMethodSchema = z.enum(['cash', 'eftpos', 'credit_card', 'debit_card', 'bank_transfer', 'hicaps', 'other']);

export const PaymentStatusSchema = z.enum(['pending', 'completed', 'failed', 'reversed']);

export const PaymentSchema = z.object({
  id: z.string().uuid(),
  tenantId: z.string().uuid(),
  patientId: z.string().uuid(),
  method: PaymentMethodSchema,
  amount: z.number(),
  currency: z.string().default('AUD'),
  status: PaymentStatusSchema,
  reference: z.string().optional(),
  providerTxId: z.string().optional(),
  idempotencyKey: z.string().optional(),
  receivedAt: z.date(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type Payment = z.infer<typeof PaymentSchema>;

export const CreatePaymentSchema = z.object({
  patientId: z.string().uuid(),
  method: PaymentMethodSchema,
  amount: z.number().positive(),
  currency: z.string().default('AUD'),
  reference: z.string().max(255).optional(),
  providerTxId: z.string().max(255).optional(),
  idempotencyKey: z.string().max(255).optional(),
});

export type CreatePayment = z.infer<typeof CreatePaymentSchema>;

export const UpdatePaymentSchema = z.object({
  status: PaymentStatusSchema.optional(),
  reference: z.string().max(255).optional(),
  providerTxId: z.string().max(255).optional(),
});

export type UpdatePayment = z.infer<typeof UpdatePaymentSchema>;

export const PaymentAllocationSchema = z.object({
  id: z.string().uuid(),
  tenantId: z.string().uuid(),
  paymentId: z.string().uuid(),
  invoiceId: z.string().uuid(),
  amount: z.number(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type PaymentAllocation = z.infer<typeof PaymentAllocationSchema>;

export const CreatePaymentAllocationSchema = z.object({
  paymentId: z.string().uuid(),
  invoiceId: z.string().uuid(),
  amount: z.number().positive(),
});

export type CreatePaymentAllocation = z.infer<typeof CreatePaymentAllocationSchema>;
