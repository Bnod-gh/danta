import { apiGet, apiPost, apiPut, apiDelete } from './request';
import type { Patient, PatientLegalGuardian, PatientSurgicalHistory, PatientRelationshipType, UpsertPatientGuardian } from '@danta/schemas';

export type PatientMedicalContext = {
  id: string | null;
  patientId: string;
  isPregnant: boolean;
  pregnancyWeek: number | null;
  isLactating: boolean;
  isOnAnticoagulants: boolean;
  anticoagulantMedication: string | null;
  inrValue: number | null;
  lastInrDate: string | null;
  isSmoker: boolean;
  smokingFrequency: string | null;
  alcoholConsumption: string | null;
  bruxism: boolean;
  adverseAnesthesiaReaction: boolean;
  anesthesiaReactionDetails: string | null;
};

export type ComputedAlert = {
  id: string;
  alertType: string;
  message: string;
  severity: 'critical' | 'warning' | 'info';
  isActive: boolean;
};

export type RelationshipView = {
  id: string;
  patientId: string;
  relatedPatientId: string;
  type: PatientRelationshipType;
  notes?: string | null;
  inverseType: PatientRelationshipType;
  relationshipLabel: string;
  relatedPatient: { id: string; firstName: string; lastName: string; patientNumber: string };
};

// --- Alerts (server-computed) ---

export async function getPatientAlerts(patientId: string): Promise<{ alerts: ComputedAlert[] }> {
  return apiGet(`/patients/${patientId}/alerts`);
}

// --- Patient identity / demographics / billing ---

export function updatePatient(patientId: string, data: Partial<Patient>): Promise<Patient> {
  return apiPut(`/patients/${patientId}`, data);
}

/** Soft-archive (status -> inactive); record is retained. */
export function archivePatient(patientId: string): Promise<Patient> {
  return apiPost(`/patients/${patientId}/archive`);
}

export function restorePatient(patientId: string): Promise<Patient> {
  return apiPost(`/patients/${patientId}/restore`);
}

// --- Medical context ---

export async function getMedicalContext(patientId: string): Promise<PatientMedicalContext> {
  return apiGet(`/patients/${patientId}/medical-context`);
}

export type MedicalContextInput = Partial<{
  isPregnant: boolean;
  pregnancyWeek: number | null;
  isLactating: boolean;
  isOnAnticoagulants: boolean;
  anticoagulantMedication: string | null;
  inrValue: number | null;
  lastInrDate: Date | string | null;
  isSmoker: boolean;
  smokingFrequency: string | null;
  alcoholConsumption: string | null;
  bruxism: boolean;
  adverseAnesthesiaReaction: boolean;
  anesthesiaReactionDetails: string | null;
}>;

export function upsertMedicalContext(
  patientId: string,
  data: MedicalContextInput,
): Promise<PatientMedicalContext> {
  return apiPut(`/patients/${patientId}/medical-context`, data);
}

// --- Surgical history ---

export async function getSurgicalHistory(patientId: string): Promise<PatientSurgicalHistory[]> {
  return apiGet(`/patients/${patientId}/surgical-history`);
}

export function createSurgicalHistory(
  patientId: string,
  data: { procedure: string; surgeryDate?: Date; complications?: string; notes?: string },
): Promise<PatientSurgicalHistory> {
  return apiPost(`/patients/${patientId}/surgical-history`, data);
}

export function deleteSurgicalHistory(patientId: string, id: string): Promise<{ deleted: boolean }> {
  return apiDelete(`/patients/${patientId}/surgical-history/${id}`);
}

// --- Legal guardian (1:1) ---

export async function getGuardian(patientId: string): Promise<PatientLegalGuardian | null> {
  return apiGet(`/patients/${patientId}/guardian`);
}

export function upsertGuardian(patientId: string, data: UpsertPatientGuardian): Promise<PatientLegalGuardian> {
  return apiPut(`/patients/${patientId}/guardian`, data);
}

export function deleteGuardian(patientId: string): Promise<{ deleted: boolean }> {
  return apiDelete(`/patients/${patientId}/guardian`);
}

// --- Patient relationships ---

export async function getRelationships(patientId: string): Promise<RelationshipView[]> {
  return apiGet(`/patients/${patientId}/relationships`);
}

export function createRelationship(
  patientId: string,
  data: { relatedPatientId: string; type: PatientRelationshipType; notes?: string },
): Promise<RelationshipView> {
  return apiPost(`/patients/${patientId}/relationships`, data);
}

export function deleteRelationship(patientId: string, relationshipId: string): Promise<{ deleted: boolean }> {
  return apiDelete(`/patients/${patientId}/relationships/${relationshipId}`);
}

export interface ClinicalTimelineEventVM {
  id: string;
  type: string;
  occurredAt: string;
  resourceType?: string;
  resourceId?: string;
  title: string;
  detail?: string;
}

export async function getClinicalOdontogram(patientId: string) {
  return apiGet<{ teeth: Record<string, { findings: unknown[]; treatments: unknown[] }>; generatedAt: string }>(
    `/patients/${patientId}/clinical/odontogram`,
  );
}

export async function getClinicalOdontogramAt(patientId: string, date: string) {
  return apiGet<{ asOf: string; teeth: Record<string, { findings: unknown[]; treatments: unknown[] }> }>(
    `/patients/${patientId}/clinical/odontogram/at`,
    { date },
  );
}

export async function getToothHistory(patientId: string, toothNumber: string) {
  return apiGet<{ events: ClinicalTimelineEventVM[]; total: number }>(
    `/patients/${patientId}/clinical/teeth/${toothNumber}/history`,
  );
}

export async function getClinicalTimeline(patientId: string, params?: { types?: string[]; take?: number }) {
  const search = new URLSearchParams();
  if (params?.types?.length) search.set('types', params.types.join(','));
  if (params?.take) search.set('take', String(params.take));
  const qs = search.toString();
  return apiGet<{ events: ClinicalTimelineEventVM[]; total: number }>(
    `/patients/${patientId}/clinical/timeline${qs ? `?${qs}` : ''}`,
  );
}
