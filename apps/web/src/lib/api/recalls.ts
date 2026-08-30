import { apiGet, apiPost, apiPut } from './request';
import type { Recall, RecallType } from '@danta/schemas';

export interface RecallTypeConfig {
  id: string;
  tenantId: string;
  type: RecallType;
  intervalDays: number;
  channel: 'sms' | 'email' | 'both';
  isActive: boolean;
}

export async function getRecalls(params: { patientId?: string; type?: string; status?: string; search?: string } = {}): Promise<{ data: Recall[]; total: number }> {
  return apiGet('/recalls', params);
}

export async function getRecallConfigs(): Promise<RecallTypeConfig[]> {
  return apiGet('/recalls/config');
}

export async function updateRecallConfig(type: string, data: { intervalDays?: number; channel?: 'sms' | 'email' | 'both'; isActive?: boolean }): Promise<RecallTypeConfig> {
  return apiPut(`/recalls/config/${type}`, data);
}

export async function runRecallScan(): Promise<{ created: number; tenantsScanned: number }> {
  return apiPost('/recalls/scan', {});
}
