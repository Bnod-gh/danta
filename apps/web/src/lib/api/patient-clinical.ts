import { apiGet, apiPost, apiPut, apiDelete, apiUpload, apiDownload } from './request';
import type {
  Patient,
  PatientLegalGuardian,
  PatientSurgicalHistory,
  PatientRelationshipType,
  UpsertPatientGuardian,
  PatientMedication,
  CreatePatientMedication,
  UpdatePatientMedication,
  ClinicalNote,
  CreateClinicalNote,
  UpdateClinicalNote,
  TreatmentPlan,
  CreateTreatmentPlan,
  UpdateTreatmentPlan,
   TreatmentHistory,
  CreateTreatmentHistory,
  UpdateTreatmentHistory,
  PatientDocument,
  CreatePatientDocument,
  OdontogramResponse,
  HistoricalOdontogramResponse,
  ToothHistoryResponse,
  ClinicalTimelineResponse,
} from '@danta/schemas';

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
  metadata?: Record<string, unknown>;
}

export async function getClinicalOdontogram(patientId: string) {
  return apiGet<OdontogramResponse>(`/patients/${patientId}/clinical/odontogram`);
}

export async function getClinicalOdontogramAt(patientId: string, date: string) {
  return apiGet<HistoricalOdontogramResponse>(`/patients/${patientId}/clinical/odontogram/at`, { date });
}

export async function getToothHistory(patientId: string, toothNumber: string) {
  return apiGet<ToothHistoryResponse>(`/patients/${patientId}/clinical/teeth/${toothNumber}/history`);
}

export async function getClinicalTimeline(patientId: string, params?: { types?: string[]; take?: number }) {
  const search = new URLSearchParams();
  if (params?.types?.length) search.set('types', params.types.join(','));
  if (params?.take) search.set('take', String(params.take));
  const qs = search.toString();
  return apiGet<ClinicalTimelineResponse>(`/patients/${patientId}/clinical/timeline${qs ? `?${qs}` : ''}`);
}

export async function getMedications(patientId: string): Promise<PatientMedication[]> {
  return apiGet(`/patients/${patientId}/medications`);
}

export function createMedication(patientId: string, data: CreatePatientMedication): Promise<PatientMedication> {
  return apiPost(`/patients/${patientId}/medications`, data);
}

export function updateMedication(patientId: string, id: string, data: UpdatePatientMedication): Promise<PatientMedication> {
  return apiPut(`/patients/${patientId}/medications/${id}`, data);
}

export function deleteMedication(patientId: string, id: string): Promise<{ deleted: boolean }> {
  return apiDelete(`/patients/${patientId}/medications/${id}`);
}

export async function getClinicalNotes(patientId: string): Promise<ClinicalNote[]> {
  const resp = await apiGet<{ data: ClinicalNote[]; total: number }>(`/clinical-notes?patientId=${patientId}`);
  return resp.data;
}

export function createClinicalNote(data: CreateClinicalNote): Promise<ClinicalNote> {
  return apiPost('/clinical-notes', data);
}

export function updateClinicalNote(id: string, data: UpdateClinicalNote): Promise<ClinicalNote> {
  return apiPut(`/clinical-notes/${id}`, data);
}

export function deleteClinicalNote(id: string): Promise<{ deleted: boolean }> {
  return apiDelete(`/clinical-notes/${id}`);
}

export async function getTreatmentPlans(patientId: string): Promise<TreatmentPlan[]> {
  const resp = await apiGet<{ data: TreatmentPlan[]; total: number }>(`/treatment-plans?patientId=${patientId}`);
  return resp.data;
}

export function createTreatmentPlan(data: CreateTreatmentPlan): Promise<TreatmentPlan> {
  return apiPost('/treatment-plans', data);
}

export function updateTreatmentPlan(id: string, data: UpdateTreatmentPlan): Promise<TreatmentPlan> {
  return apiPut(`/treatment-plans/${id}`, data);
}

export function deleteTreatmentPlan(id: string): Promise<{ deleted: boolean }> {
  return apiDelete(`/treatment-plans/${id}`);
}

export async function getTreatmentHistory(patientId: string): Promise<TreatmentHistory[]> {
  return apiGet(`/treatment-history?patientId=${patientId}`);
}

export function createTreatmentHistory(data: CreateTreatmentHistory): Promise<TreatmentHistory> {
  return apiPost('/treatment-history', data);
}

export function updateTreatmentHistory(id: string, data: UpdateTreatmentHistory): Promise<TreatmentHistory> {
  return apiPut(`/treatment-history/${id}`, data);
}

export function deleteTreatmentHistory(id: string): Promise<{ deleted: boolean }> {
  return apiDelete(`/treatment-history/${id}`);
}

// --- Patient Documents CRUD ---

export async function getPatientDocuments(patientId: string): Promise<PatientDocument[]> {
  return apiGet(`/patients/${patientId}/documents`);
}

export async function uploadPatientDocument(patientId: string, file: File, name: string): Promise<PatientDocument> {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('name', name);
  return apiUpload<PatientDocument>(`/patients/${patientId}/documents/upload`, formData);
}

export function createPatientDocument(patientId: string, data: CreatePatientDocument): Promise<PatientDocument> {
  return apiPost(`/patients/${patientId}/documents`, data);
}

export function updatePatientDocument(patientId: string, docId: string, data: { name?: string }): Promise<PatientDocument> {
  return apiPut(`/patients/${patientId}/documents/${docId}`, data);
}

export function deletePatientDocument(patientId: string, docId: string): Promise<{ deleted: boolean }> {
  return apiDelete(`/patients/${patientId}/documents/${docId}`);
}

export async function downloadPatientDocument(patientId: string, docId: string): Promise<Blob> {
  return apiDownload(`/patients/${patientId}/documents/${docId}/download`);
}

// --- Document Types Setting ---

export async function getDocumentTypes(): Promise<Array<{ id: string; name: string }>> {
  const settings = await apiGet<Array<{ key: string; value: Record<string, unknown> }>>('/settings');
  const docSetting = settings.find((s) => s.key === 'document_types');
  if (!docSetting || !docSetting.value) return [];
  const v = docSetting.value;
  if (Array.isArray(v)) return v as Array<{ id: string; name: string }>;
  if (typeof v === 'string') {
    try { return JSON.parse(v) as Array<{ id: string; name: string }>; } catch { }
  }
  return [];
}

export interface ClinicalTimelineEventVM {
  id: string;
  type: string;
  occurredAt: string;
  resourceType?: string;
  resourceId?: string;
  title: string;
  detail?: string;
  metadata?: Record<string, unknown>;
}
