import { apiGet, apiPost } from './request';

export interface EstimateItemVM {
  id: string;
  cdtCode?: string | null;
  description: string;
  toothNumber?: string | null;
  quantity: number;
  unitPrice: number | string;
  discount: number | string;
  taxRate: number | string;
  total: number | string;
}

export interface EstimateVM {
  id: string;
  estimateNumber: string;
  status: 'draft' | 'presented' | 'approved' | 'partially_approved' | 'rejected' | 'expired' | 'cancelled';
  version: number;
  subtotal: number | string;
  discount: number | string;
  tax: number | string;
  total: number | string;
  validUntil?: string | null;
  presentedAt?: string | null;
  approvedAt?: string | null;
  patientId: string;
  treatmentPlanId?: string | null;
  items: EstimateItemVM[];
  createdAt: string;
}

export function getEstimates(params?: { patientId?: string }) {
  const search = new URLSearchParams();
  if (params?.patientId) search.set('patientId', params.patientId);
  const qs = search.toString();
  return apiGet<EstimateVM[]>(`/estimates${qs ? `?${qs}` : ''}`);
}

export function createEstimateFromPlan(input: { treatmentPlanId: string; itemIds?: string[]; notes?: string }) {
  return apiPost<EstimateVM>('/estimates/from-plan', input);
}

export function presentEstimate(id: string) {
  return apiPost<EstimateVM>(`/estimates/${id}/present`, {});
}

export function recordEstimateDecision(
  id: string,
  input: { decision: 'approved' | 'rejected' | 'partially_approved'; signerName: string; method: 'in_person' | 'written' | 'electronic' | 'verbal'; note?: string },
) {
  return apiPost<EstimateVM>(`/estimates/${id}/decision`, input);
}

export function cancelEstimate(id: string) {
  return apiPost<EstimateVM>(`/estimates/${id}/cancel`, {});
}
