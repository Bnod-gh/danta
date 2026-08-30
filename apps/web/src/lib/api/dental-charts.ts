import { apiGet, apiPost, apiPut, apiDelete } from './request';
import type { CreateToothCondition, DentalChart, ToothCondition, UpdateToothCondition, BatchCreateToothCondition } from '@danta/schemas';

export async function getDentalCharts(patientId?: string): Promise<DentalChart[]> {
  return apiGet('/dental-charts', patientId ? { patientId } : undefined);
}

export async function createDentalChart(data: { patientId: string; notes?: string }): Promise<DentalChart> {
  return apiPost('/dental-charts', data);
}

export interface ChartPlanLine {
  condition: string;
  label: string;
  toothNumber: string;
  surface?: string | null;
  code: string;
  description: string;
  defaultFee: number;
}

export async function generatePlanFromChart(
  chartId: string,
  providerId?: string,
): Promise<{ plan: { id: string; name: string }; items: ChartPlanLine[]; estimatedTotal: number }> {
  return apiPost(`/dental-charts/${chartId}/generate-plan`, providerId ? { providerId } : {});
}

export async function getToothConditions(dentalChartId: string): Promise<ToothCondition[]> {
  return apiGet('/tooth-conditions', { dentalChartId });
}

export async function addToothCondition(data: CreateToothCondition): Promise<ToothCondition> {
  return apiPost('/tooth-conditions', data);
}

export async function updateToothCondition(id: string, data: UpdateToothCondition): Promise<ToothCondition> {
  return apiPut(`/tooth-conditions/${id}`, data);
}

export async function deleteToothCondition(id: string): Promise<{ deleted: boolean }> {
  return apiDelete(`/tooth-conditions/${id}`);
}
export async function batchApplyConditions(chartId: string, data: Omit<BatchCreateToothCondition, 'dentalChartId'>): Promise<{ created: number; ids: string[] }> {
  return apiPost(`/dental-charts/${chartId}/conditions/batch`, data);
}


export interface PaletteTreatment {
  id: string;
  code: string;
  description: string;
  category: string;
  defaultFee: number;
  chartTargetCondition: string | null;
  chartDefaultSurfaces: string[];
  icon: string | null;
}

export async function getProcedureCatalog(category?: string): Promise<PaletteTreatment[]> {
  return apiGet('/procedure-codes', category ? { category } : undefined);
}
