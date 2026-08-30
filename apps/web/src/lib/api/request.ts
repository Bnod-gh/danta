import { apiClient } from '../api-client';

function normalizeApiPath(path: string): string {
  return path.startsWith('/api/v1/') ? path.slice('/api/v1'.length) : path;
}

export async function apiGet<T>(path: string, params?: Record<string, string | number | boolean | undefined>): Promise<T> {
  const response = await apiClient.get<T>(normalizeApiPath(path), { params });
  return response.data;
}

export async function apiPost<T>(path: string, data?: unknown): Promise<T> {
  const response = await apiClient.post<T>(normalizeApiPath(path), data);
  return response.data;
}

export async function apiPut<T>(path: string, data?: unknown): Promise<T> {
  const response = await apiClient.put<T>(normalizeApiPath(path), data);
  return response.data;
}

export async function apiDelete<T>(path: string): Promise<T> {
  const response = await apiClient.delete<T>(normalizeApiPath(path));
  return response.data;
}

export async function apiPatch<T>(path: string, data?: unknown): Promise<T> {
  const response = await apiClient.patch<T>(normalizeApiPath(path), data);
  return response.data;
}

export async function apiDownload(path: string): Promise<Blob> {
  const response = await apiClient.get(normalizeApiPath(path), { responseType: 'blob' });
  return response.data as Blob;
}

export async function apiUpload<T>(path: string, formData: FormData): Promise<T> {
  const response = await apiClient.post<T>(normalizeApiPath(path), formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data;
}
