import { apiGet, apiPost, apiPut, apiDelete } from './request';
import type { Provider, CreateProvider, UpdateProvider } from '@danta/schemas';

export async function getProviders(): Promise<Provider[]> {
  return apiGet('/providers');
}

export async function getProvider(id: string): Promise<Provider> {
  return apiGet(`/providers/${id}`);
}

export async function createProvider(data: CreateProvider): Promise<Provider> {
  return apiPost('/providers', data);
}

export async function updateProvider(id: string, data: UpdateProvider): Promise<Provider> {
  return apiPut(`/providers/${id}`, data);
}

export async function deleteProvider(id: string): Promise<{ deleted: boolean }> {
  return apiDelete(`/providers/${id}`);
}
