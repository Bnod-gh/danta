import { apiGet, apiPost, apiPut, apiDelete } from './request';
import type { Service, FeeSchedule } from '@danta/schemas';

export type InvoiceRecord = {
  id: string;
  patientId: string;
  patient: { id: string; firstName: string; lastName: string };
  invoiceNumber: string;
  status: string;
  issueDate: string;
  dueDate: string;
  subtotal: number;
  tax: number;
  total: number;
  balance: number;
  notes?: string;
  items: InvoiceItem[];
};

export type InvoiceItem = {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
  service?: { id: string; name: string };
};

export type PaymentRecord = {
  id: string;
  patientId: string;
  patient: { id: string; firstName: string; lastName: string };
  method: string;
  amount: number;
  status: string;
  reference?: string;
  receivedAt: string;
  allocations: PaymentAllocation[];
};

export type PaymentAllocation = {
  id: string;
  paymentId: string;
  invoiceId: string;
  amount: number;
  invoice: { id: string; invoiceNumber: string };
};

export type RefundRecord = {
  id: string;
  paymentId: string;
  invoiceId?: string;
  invoice?: { id: string; invoiceNumber: string };
  amount: number;
  reason?: string;
  status: string;
};

export type StatementRecord = {
  patientId: string;
  fromDate: string;
  toDate: string;
  openingBalance: number;
  closingBalance: number;
  invoices: Array<{
    id: string;
    invoiceNumber: string;
    date: string;
    total: number;
    status: string;
  }>;
  payments: Array<{
    id: string;
    date: string;
    amount: number;
    method: string;
  }>;
  refunds: Array<{
    id: string;
    date: string;
    amount: number;
    reason?: string;
  }>;
};

export async function getInvoices(patientId?: string, status?: string): Promise<{ data: InvoiceRecord[]; total: number }> {
  return apiGet('/api/v1/invoices', { patientId, status });
}

export async function getInvoice(id: string): Promise<InvoiceRecord> {
  return apiGet(`/api/v1/invoices/${id}`);
}

export async function getInvoiceItems(invoiceId: string): Promise<InvoiceItem[]> {
  return apiGet(`/api/v1/invoices/${invoiceId}/items`);
}

export async function createInvoice(data: { patientId: string; dueDate: string; notes?: string }): Promise<InvoiceRecord> {
  return apiPost('/api/v1/invoices', data);
}

export async function updateInvoice(id: string, data: Partial<InvoiceRecord>): Promise<InvoiceRecord> {
  return apiPut(`/api/v1/invoices/${id}`, data);
}

export async function deleteInvoice(id: string): Promise<{ deleted: boolean }> {
  return apiDelete(`/api/v1/invoices/${id}`);
}

export async function voidInvoice(id: string, reason?: string): Promise<InvoiceRecord> {
  return apiPost(`/api/v1/invoices/${id}/void`, { reason });
}

export async function writeOffInvoice(id: string, reason?: string): Promise<InvoiceRecord> {
  return apiPost(`/api/v1/invoices/${id}/write-off`, { reason });
}

export async function getPayments(patientId?: string): Promise<{ data: PaymentRecord[]; total: number }> {
  return apiGet('/api/v1/payments', { patientId });
}

export async function getPayment(id: string): Promise<PaymentRecord> {
  return apiGet(`/api/v1/payments/${id}`);
}

export async function createPayment(data: { patientId: string; method: string; amount: number; reference?: string }): Promise<PaymentRecord> {
  return apiPost('/api/v1/payments', data);
}

export async function updatePayment(id: string, data: Partial<PaymentRecord>): Promise<PaymentRecord> {
  return apiPut(`/api/v1/payments/${id}`, data);
}

export async function allocatePayment(paymentId: string, invoiceId: string, amount: number): Promise<PaymentAllocation> {
  return apiPost(`/api/v1/payments/${paymentId}/allocate`, { paymentId, invoiceId, amount });
}

export async function refundPayment(paymentId: string, invoiceId?: string, amount?: number, reason?: string): Promise<unknown> {
  return apiPost(`/api/v1/payments/${paymentId}/refund`, { paymentId, invoiceId, amount, reason });
}

export async function getRefunds(paymentId?: string): Promise<RefundRecord[]> {
  return apiGet('/api/v1/refunds', { paymentId });
}

export async function getRefund(id: string): Promise<RefundRecord> {
  return apiGet(`/api/v1/refunds/${id}`);
}

export async function createRefund(data: { paymentId: string; invoiceId?: string; amount: number; reason?: string }): Promise<RefundRecord> {
  return apiPost('/api/v1/refunds', data);
}

export async function updateRefund(id: string, data: Partial<RefundRecord>): Promise<RefundRecord> {
  return apiPut(`/api/v1/refunds/${id}`, data);
}

export async function deleteRefund(id: string): Promise<{ deleted: boolean }> {
  return apiDelete(`/api/v1/refunds/${id}`);
}

export async function generateReceipt(paymentId: string): Promise<{
  id: string;
  tenantId: string;
  paymentId: string;
  receiptNumber: string;
  amount: number;
  currency: string;
  method: string;
  patientId: string;
  issuedAt: string;
  createdAt: string;
  patient: { id: string; firstName: string; lastName: string; patientNumber: string };
  allocations: { invoice: { id: string; invoiceNumber: string } }[];
  reference?: string;
}> {
  return apiGet(`/api/v1/receipts/${paymentId}`);
}

export async function generateStatement(patientId: string, startDate: string, endDate: string): Promise<StatementRecord> {
  return apiPost('/api/v1/statements/generate', { patientId, startDate, endDate });
}

export async function sendStatement(statementId: string): Promise<unknown> {
  return apiPost(`/api/v1/statements/${statementId}/send`);
}

export async function getFees(serviceId?: string): Promise<FeeSchedule[]> {
  return apiGet('/api/v1/fees', { serviceId });
}

export async function getFee(id: string): Promise<FeeSchedule & { service: Service }> {
  return apiGet(`/api/v1/fees/${id}`);
}

export async function createFee(data: { serviceId: string; amount: number; currency?: string; effectiveFrom: string; effectiveTo?: string }): Promise<FeeSchedule & { service: Service }> {
  return apiPost('/api/v1/fees', data);
}

export async function updateFee(id: string, data: { serviceId?: string; amount?: number; currency?: string; effectiveFrom?: string; effectiveTo?: string; isActive?: boolean }): Promise<FeeSchedule & { service: Service }> {
  return apiPut(`/api/v1/fees/${id}`, data);
}

export async function deleteFee(id: string): Promise<{ deleted: boolean }> {
  return apiDelete(`/api/v1/fees/${id}`);
}

export async function getServices(): Promise<Service[]> {
  return apiGet('/api/v1/services');
}
