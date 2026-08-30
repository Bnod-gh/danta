import { apiGet, apiPost, apiPut, apiDelete } from './request';
import type { Chair, ChairLiveStatus, CreateChair, UpdateChair } from '@danta/schemas';

export async function getChairs(): Promise<Chair[]> {
  return apiGet('/chairs');
}

export async function getLiveChairs(): Promise<ChairLiveStatus[]> {
  return apiGet('/chairs/live');
}

export async function getChair(id: string): Promise<Chair> {
  return apiGet(`/chairs/${id}`);
}

export async function createChair(data: CreateChair): Promise<Chair> {
  return apiPost('/chairs', data);
}

export async function updateChair(id: string, data: UpdateChair): Promise<Chair> {
  return apiPut(`/chairs/${id}`, data);
}

export async function deleteChair(id: string): Promise<{ deleted: boolean }> {
  return apiDelete(`/chairs/${id}`);
}
