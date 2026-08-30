import { apiGet, apiPost, apiPut, apiDelete } from './request';
import type { ProviderShift, ScheduleOverride } from '@danta/schemas';
import type { AppointmentListItem } from './appointments';

export type FreeSlotsResponse = {
  providerId: string;
  date: string;
  durationMin: number;
  stepMin: number;
  slots: Array<{ startTime: string; endTime: string }>;
};

export async function getShifts(providerId?: string): Promise<ProviderShift[]> {
  return apiGet('/schedules/shifts', { providerId });
}

export function createShift(data: Omit<ProviderShift, 'id' | 'tenantId' | 'createdAt' | 'updatedAt'>): Promise<ProviderShift> {
  return apiPost('/schedules/shifts', data);
}

export function updateShift(id: string, data: Partial<Omit<ProviderShift, 'id' | 'tenantId' | 'createdAt' | 'updatedAt'>>): Promise<ProviderShift> {
  return apiPut(`/schedules/shifts/${id}`, data);
}

export function deleteShift(id: string): Promise<{ deleted: boolean }> {
  return apiDelete(`/schedules/shifts/${id}`);
}

export async function getOverrides(params?: { providerId?: string; from?: string; to?: string }): Promise<ScheduleOverride[]> {
  return apiGet('/schedules/overrides', params);
}

export function createOverride(data: {
  providerId: string;
  date: Date | string;
  type?: 'time_off' | 'custom_hours';
  isFullDay?: boolean;
  startTime?: string;
  endTime?: string;
  reason?: string;
}): Promise<ScheduleOverride> {
  return apiPost('/schedules/overrides', data);
}

export function updateOverride(id: string, data: Partial<Omit<ScheduleOverride, 'id' | 'tenantId' | 'providerId' | 'createdAt' | 'updatedAt'>>): Promise<ScheduleOverride> {
  return apiPut(`/schedules/overrides/${id}`, data);
}

export function deleteOverride(id: string): Promise<{ deleted: boolean }> {
  return apiDelete(`/schedules/overrides/${id}`);
}

export function getFreeSlots(params: { providerId: string; date: string; durationMin?: number; stepMin?: number }): Promise<FreeSlotsResponse> {
  return apiGet<FreeSlotsResponse>('/schedules/free-slots', params as unknown as Record<string, string>);
}

export function rescheduleAppointment(id: string, data: { startTime: string; endTime: string; chairId?: string; providerId?: string }): Promise<AppointmentListItem> {
  return apiPost(`/appointments/${id}/reschedule`, data);
}

