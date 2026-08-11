import { z } from 'zod';

export const StatementSchema = z.object({
  patientId: z.string().uuid(),
  fromDate: z.date(),
  toDate: z.date(),
  openingBalance: z.number(),
  closingBalance: z.number(),
  invoices: z.array(z.object({
    id: z.string().uuid(),
    invoiceNumber: z.string(),
    date: z.date(),
    total: z.number(),
    status: z.string(),
  })),
  payments: z.array(z.object({
    id: z.string().uuid(),
    date: z.date(),
    amount: z.number(),
    method: z.string(),
  })),
  refunds: z.array(z.object({
    id: z.string().uuid(),
    date: z.date(),
    amount: z.number(),
    reason: z.string().optional(),
  })),
});

export type Statement = z.infer<typeof StatementSchema>;

export const StatementQuerySchema = z.object({
  patientId: z.string().uuid(),
  fromDate: z.coerce.date(),
  toDate: z.coerce.date(),
});

export type StatementQuery = z.infer<typeof StatementQuerySchema>;

export const ReceiptSchema = z.object({
  id: z.string().uuid(),
  tenantId: z.string().uuid(),
  paymentId: z.string().uuid(),
  receiptNumber: z.string(),
  amount: z.number(),
  currency: z.string().default('AUD'),
  method: z.string(),
  patientId: z.string().uuid(),
  issuedAt: z.date(),
  createdAt: z.date(),
});

export type Receipt = z.infer<typeof ReceiptSchema>;

export const ReceiptQuerySchema = z.object({
  paymentId: z.string().uuid().optional(),
  patientId: z.string().uuid().optional(),
});

export type ReceiptQuery = z.infer<typeof ReceiptQuerySchema>;
