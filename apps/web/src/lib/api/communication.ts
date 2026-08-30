import { apiGet, apiPost, apiPut, apiDelete } from './request';
import type { Message, CreateMessage, UpdateMessage, CommunicationTemplate, CreateCommunicationTemplate, UpdateCommunicationTemplate, CommunicationPreference, CreateCommunicationPreference, UpdateCommunicationPreference, AppointmentReminder, CreateAppointmentReminder, UpdateAppointmentReminder } from '@danta/schemas';

export async function sendMessage(data: CreateMessage): Promise<Message> {
  return apiPost('/communication/send', data);
}

export async function getDeliveryStatus(messageId: string): Promise<Message> {
  return apiGet(`/communication/messages/${messageId}/status`);
}

export async function retryFailedMessage(messageId: string): Promise<Message> {
  return apiPost(`/communication/messages/${messageId}/retry`);
}

export async function getMessages(params?: { patientId?: string; channel?: string; status?: string }): Promise<{ data: Message[]; total: number }> {
  return apiGet('/messages', params);
}

export async function getMessage(id: string): Promise<Message> {
  return apiGet(`/messages/${id}`);
}

export async function updateMessage(id: string, data: UpdateMessage): Promise<Message> {
  return apiPut(`/messages/${id}`, data);
}

export async function getCommunicationTemplates(category?: string): Promise<CommunicationTemplate[]> {
  return apiGet('/communication-templates', category ? { category } : undefined);
}

export async function createCommunicationTemplate(data: CreateCommunicationTemplate): Promise<CommunicationTemplate> {
  return apiPost('/communication-templates', data);
}

export async function updateCommunicationTemplate(id: string, data: UpdateCommunicationTemplate): Promise<CommunicationTemplate> {
  return apiPut(`/communication-templates/${id}`, data);
}

export async function deleteCommunicationTemplate(id: string): Promise<{ deleted: boolean }> {
  return apiDelete(`/communication-templates/${id}`);
}

export async function getCommunicationPreferences(patientId?: string): Promise<CommunicationPreference[]> {
  return apiGet('/communication-preferences', patientId ? { patientId } : undefined);
}

export async function getCommunicationPreference(id: string): Promise<CommunicationPreference> {
  return apiGet(`/communication-preferences/${id}`);
}

export async function createCommunicationPreference(data: CreateCommunicationPreference): Promise<CommunicationPreference> {
  return apiPost('/communication-preferences', data);
}

export async function updateCommunicationPreference(id: string, data: UpdateCommunicationPreference): Promise<CommunicationPreference> {
  return apiPut(`/communication-preferences/${id}`, data);
}

export async function getAppointmentReminders(appointmentId?: string): Promise<AppointmentReminder[]> {
  return apiGet('/appointment-reminders', appointmentId ? { appointmentId } : undefined);
}

export async function createAppointmentReminder(data: CreateAppointmentReminder): Promise<AppointmentReminder> {
  return apiPost('/appointment-reminders', data);
}

export async function updateAppointmentReminder(id: string, data: UpdateAppointmentReminder): Promise<AppointmentReminder> {
  return apiPut(`/appointment-reminders/${id}`, data);
}
