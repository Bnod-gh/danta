import { apiClient } from '../api-client';
import type { Notification } from '@danta/schemas';

export interface UnreadCountResponse {
  count: number;
}

export interface NotificationsResponse {
  data: Notification[];
  total: number;
  skip: number;
  take: number;
}

export async function getNotifications(read?: boolean): Promise<NotificationsResponse> {
  const params: Record<string, unknown> = {};
  if (read !== undefined) params.read = String(read);
  const response = await apiClient.get('/notifications', { params });
  return response.data;
}

export async function getNotification(id: string): Promise<Notification> {
  const response = await apiClient.get(`/notifications/${id}`);
  return response.data;
}

export async function createNotification(data: {
  patientId?: string;
  userId?: string;
  type: string;
  title: string;
  message: string;
  data?: Record<string, unknown>;
}): Promise<Notification> {
  const response = await apiClient.post('/notifications', data);
  return response.data;
}

export async function markNotificationAsRead(id: string): Promise<void> {
  await apiClient.post(`/notifications/${id}/read`);
}

export async function markAllNotificationsAsRead(): Promise<void> {
  await apiClient.post('/notifications/read-all');
}

export async function getUnreadNotificationCount(): Promise<UnreadCountResponse> {
  const response = await apiClient.get('/notifications/unread-count');
  return response.data;
}
