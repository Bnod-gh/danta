import { apiGet, apiPut } from './request';
import type { TenantSettings, SettingsGroup } from '@danta/schemas';

export type TeamMember = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  role: string;
  status: string;
  lastLoginAt: string | null;
  createdAt: string;
};

export async function getTenantSettings(): Promise<TenantSettings> {
  return apiGet('/settings');
}

export function updateSettingsGroup<G extends SettingsGroup>(
  group: G,
  data: Partial<TenantSettings[G]>,
): Promise<unknown> {
  return apiPut(`/settings/${group}`, data);
}

export async function getTeamMembers(): Promise<TeamMember[]> {
  return apiGet('/users');
}
