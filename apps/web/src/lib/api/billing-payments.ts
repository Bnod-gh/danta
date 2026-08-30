import { apiGet, apiPost } from './request';

export interface PaymentVM {
  id: string;
  patientId: string;
  method: string;
  amount: number | string;
  status: string;
  reference?: string | null;
  receivedAt: string;
}

export interface RefundVM {
  id: string;
  paymentId: string;
  amount: number | string;
  reason?: string | null;
  status: string;
  createdAt: string;
  processedAt: string | null;
}

export function getPayments(params?: { patientId?: string; take?: number }) {
  const search = new URLSearchParams();
  if (params?.patientId) search.set('patientId', params.patientId);
  if (params?.take) search.set('take', String(params.take));
  const qs = search.toString();
  return apiGet<PaymentVM[]>(`/payments${qs ? `?${qs}` : ''}`);
}

export function createPayment(input: {
  patientId: string;
  method: 'cash' | 'eftpos' | 'credit_card' | 'debit_card' | 'bank_transfer' | 'hicaps' | 'other';
  amount: number;
  reference?: string;
}) {
  return apiPost<PaymentVM>('/payments', input);
}

export function allocatePayment(paymentId: string, invoiceId: string, amount: number) {
  return apiPost('/payments/allocate', { paymentId, invoiceId, amount });
}

export function createRefund(input: { paymentId: string; invoiceId?: string; amount: number; reason?: string }) {
  return apiPost<RefundVM>('/refunds', input);
}
