import { apiGet, apiPost, apiPut } from './request';
import type { Appointment, Chair, CreateAppointment, Provider } from '@danta/schemas';

export type AppointmentListItem = Appointment & {
  patient: { id: string; firstName: string; lastName: string; patientNumber: string };
  provider: { id: string; firstName: string; lastName: string; color?: string };
  chair: { id: string; name: string };
  appointmentType: { id: string; name: string; code?: string | null; duration: number; color?: string };
};

export async function getAppointments(params: { search?: string; status?: string; skip?: number; take?: number }): Promise<{ data: AppointmentListItem[]; total: number }> {
  return apiGet('/appointments', params);
}

export async function createAppointment(data: CreateAppointment): Promise<Appointment> {
  return apiPost('/appointments', data);
}

export async function getProviders(): Promise<Provider[]> {
  return apiGet('/providers');
}

export async function getChairsForBooking(): Promise<Chair[]> {
  return apiGet('/chairs');
}

export const statusActions = ['check-in', 'start', 'complete', 'no-show'] as const;
export type StatusAction = (typeof statusActions)[number];

const ENDPOINTS: Record<StatusAction, string> = {
  'check-in': 'check-in',
  start: 'start',
  complete: 'complete',
  'no-show': 'no-show',
};

export function transition(id: string, action: StatusAction): Promise<Appointment> {
  return apiPost(`/appointments/${id}/${ENDPOINTS[action]}`, {});
}

export function cancelAppointment(id: string): Promise<Appointment> {
  return apiPut(`/appointments/${id}`, { status: 'cancelled' });
}

export function confirmAppointment(id: string): Promise<Appointment> {
  return apiPut(`/appointments/${id}`, { status: 'confirmed' });
}
