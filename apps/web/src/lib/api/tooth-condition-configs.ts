import { apiGet, apiPost, apiPut, apiDelete } from './request';
import type {
  ToothConditionConfig,
  CreateToothConditionConfig,
  UpdateToothConditionConfig,
} from '@danta/schemas';

export async function getToothConditionConfigs(active?: boolean): Promise<ToothConditionConfig[]> {
  const params = new URLSearchParams();
  if (active !== undefined) params.set('active', String(active));
  const qs = params.toString();
  return apiGet(`/tooth-condition-configs${qs ? `?${qs}` : ''}`);
}

export async function getToothConditionConfig(id: string): Promise<ToothConditionConfig> {
  return apiGet(`/tooth-condition-configs/${id}`);
}

export async function createToothConditionConfig(data: CreateToothConditionConfig): Promise<ToothConditionConfig> {
  return apiPost('/tooth-condition-configs', data);
}

export async function updateToothConditionConfig(id: string, data: UpdateToothConditionConfig): Promise<ToothConditionConfig> {
  return apiPut(`/tooth-condition-configs/${id}`, data);
}

export async function deleteToothConditionConfig(id: string): Promise<{ deleted: boolean }> {
  return apiDelete(`/tooth-condition-configs/${id}`);
}
