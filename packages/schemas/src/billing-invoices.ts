import { z } from 'zod';

export const InvoiceStatusSchema = z.enum(['draft', 'issued', 'partially_paid', 'paid', 'voided', 'written_off', 'refunded']);

export const InvoiceSchema = z.object({
  id: z.string().uuid(),
  tenantId: z.string().uuid(),
  patientId: z.string().uuid(),
  invoiceNumber: z.string(),
  status: InvoiceStatusSchema,
  issueDate: z.date(),
  dueDate: z.date(),
  subtotal: z.number(),
  tax: z.number(),
  total: z.number(),
  balance: z.number(),
  notes: z.string().optional(),
  voidedAt: z.date().optional(),
  voidedBy: z.string().optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type Invoice = z.infer<typeof InvoiceSchema>;

export const CreateInvoiceSchema = z.object({
  patientId: z.string().uuid(),
  dueDate: z.coerce.date(),
  notes: z.string().max(1000).optional(),
});

export type CreateInvoice = z.infer<typeof CreateInvoiceSchema>;

export const UpdateInvoiceSchema = z.object({
  status: InvoiceStatusSchema.optional(),
  notes: z.string().max(1000).optional(),
  dueDate: z.coerce.date().optional(),
});

export type UpdateInvoice = z.infer<typeof UpdateInvoiceSchema>;

export const InvoiceItemSchema = z.object({
  id: z.string().uuid(),
  tenantId: z.string().uuid(),
  invoiceId: z.string().uuid(),
  serviceId: z.string().uuid().optional(),
  description: z.string(),
  quantity: z.number().int().positive(),
  unitPrice: z.number(),
  taxRate: z.number(),
  total: z.number(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type InvoiceItem = z.infer<typeof InvoiceItemSchema>;

export const CreateInvoiceItemSchema = z.object({
  serviceId: z.string().uuid().optional(),
  description: z.string().min(1).max(255),
  quantity: z.number().int().positive().default(1),
  unitPrice: z.number().positive(),
  taxRate: z.number().default(0),
});

export type CreateInvoiceItem = z.infer<typeof CreateInvoiceItemSchema>;

export const UpdateInvoiceItemSchema = CreateInvoiceItemSchema.partial();

export type UpdateInvoiceItem = z.infer<typeof UpdateInvoiceItemSchema>;
