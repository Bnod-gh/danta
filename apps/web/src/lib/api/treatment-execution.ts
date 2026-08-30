import { apiGet, apiPost } from './request';

export interface PlanItemVM {
  id: string;
  planId: string;
  description: string;
  treatmentCode?: string | null;
  toothNumber?: string | null;
  surfaces: string[];
  quantity: number;
  unitPrice: number | string;
  discount: number | string;
  status: string;
}

export function getPerformablePlanItems(patientId: string) {
  return apiGet<PlanItemVM[]>('/treatment-plan-items', {
    patientId,
    statuses: 'accepted,scheduled,in_progress,partially_completed',
  });
}

export interface PerformTreatmentInput {
  planItemId?: string;
  treatment?: string;
  toothNumber?: string;
  surfaces?: string[];
  cost?: number;
  resolveFindingIds?: string[];
}

export interface PerformTreatmentsResult {
  treatments: Array<{ id: string; treatment: string; cost: number | null }>;
  completedItemIds: string[];
  resolvedFindings: number;
  recall?: { id: string; dueDate: string } | null;
  invoice?: { id: string; invoiceNumber: string; total: number | string } | null;
}

export function performTreatments(
  appointmentId: string,
  input: { items: PerformTreatmentInput[]; createInvoice: boolean; taxRate: number },
) {
  return apiPost<PerformTreatmentsResult>(`/appointments/${appointmentId}/perform-treatments`, input);
}
