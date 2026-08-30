import { apiGet, apiPost, apiPut } from './request';
import type { ClaimHistoryItem, ClaimQuery, InsuranceClaim, Invoice, ProcedureCode, UpdateClaimStatus } from '@danta/schemas';

export type ClaimRow = InsuranceClaim & {
  patient: { id: string; firstName: string; lastName: string; patientNumber: string };
  invoice?: { id: string; invoiceNumber: string } | null;
};

export async function getClaims(query: ClaimQuery = {}): Promise<ClaimRow[]> {
  return apiGet('/claims', query);
}

export async function createClaim(data: { invoiceId: string; integrationId?: string; notes?: string }): Promise<InsuranceClaim> {
  return apiPost('/claims', data);
}

export async function submitClaim(id: string, integrationId?: string): Promise<InsuranceClaim> {
  return apiPost(`/claims/${id}/submit`, integrationId ? { integrationId } : {});
}

export async function updateClaimStatus(id: string, data: UpdateClaimStatus): Promise<InsuranceClaim> {
  return apiPut(`/claims/${id}/status`, data);
}

export async function getClaimHistory(id: string): Promise<ClaimHistoryItem[]> {
  return apiGet(`/claims/${id}/history`);
}

export async function getProcedureCodes(params: { category?: string; search?: string } = {}): Promise<ProcedureCode[]> {
  return apiGet('/procedure-codes', params);
}

export type InvoiceRow = Invoice & {
  patient: { id: string; firstName: string; lastName: string; patientNumber: string };
  items: Array<{ id: string; description: string; cdtCode?: string | null; quantity: number; unitPrice: string; total: string; insuranceCovered: string; copay: string }>;
};

export async function getInvoices(params: { search?: string; status?: string; patientId?: string; take?: number } = {}): Promise<{ data: InvoiceRow[]; total: number }> {
  return apiGet('/invoices', params);
}

export async function getInvoice(id: string): Promise<InvoiceRow> {
  return apiGet(`/invoices/${id}`);
}
