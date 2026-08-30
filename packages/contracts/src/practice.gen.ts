import type { Tenant, Practice, Setting } from './common.gen';

export interface ResolveTenantRequest {
  tenantId: string;
}

export interface ResolveTenantResponse {
  tenant: Tenant;
  found: boolean;
}

export interface GetPracticeRequest {
  practiceId: string;
}

export interface GetPracticeResponse {
  practice: Practice;
  found: boolean;
}

export interface CheckEntitlementRequest {
  tenantId: string;
  feature: string;
}

export interface CheckEntitlementResponse {
  entitled: boolean;
}

export interface GetSettingsRequest {
  tenantId: string;
}

export interface GetSettingsResponse {
  settings: Setting[];
}

export interface UpsertSettingRequest {
  tenantId: string;
  key: string;
  valueJson: string;
  userId: string;
}

export interface UpsertSettingResponse {
  setting: Setting;
}
