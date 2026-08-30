import { apiDownload, apiGet, apiPost, apiPut, apiUpload } from './request';
import type { ImagingImage, ImagingStudy } from '@danta/schemas';

export type StudyRow = ImagingStudy & {
  patient: { id: string; firstName: string; lastName: string };
  provider: { id: string; firstName: string; lastName: string };
  images?: ImageRow[];
};

export type ImageRow = ImagingImage & {
  imagingStudy?: {
    id: string;
    modality: string;
    patient: { id: string; firstName: string; lastName: string; patientNumber: string };
  };
};

export async function getStudies(query: { patientId?: string; modality?: string; status?: string } = {}): Promise<StudyRow[]> {
  return apiGet('/imaging-studies', query);
}

export async function createStudy(data: {
  patientId: string;
  providerId: string;
  studyDate: Date;
  modality: string;
  description?: string;
  status?: string;
}): Promise<ImagingStudy> {
  return apiPost('/imaging-studies', data);
}

/** Finds an open (non-terminal) study for the patient+modality or creates one; resolves to its id. */
export async function ensureOpenStudy(params: {
  patientId: string;
  modality: string;
  providerId?: string;
  providerFallback?: string;
  description?: string;
}): Promise<string> {
  const existing = await getStudies({ patientId: params.patientId, modality: params.modality });
  const openStudy = existing.find((study) => study.status !== 'completed' && study.status !== 'cancelled');
  if (openStudy) return openStudy.id;

  const providerId = params.providerId ?? params.providerFallback;
  if (!providerId) throw new Error('A practitioner is required to create the imaging study');
  const study = await createStudy({
    patientId: params.patientId,
    providerId,
    studyDate: new Date(),
    modality: params.modality,
    ...(params.description ? { description: params.description } : {}),
    status: 'in_progress',
  });
  return study.id;
}

export async function getImages(imagingStudyId?: string): Promise<ImageRow[]> {
  return apiGet('/imaging-images', imagingStudyId ? { imagingStudyId } : undefined);
}

export async function updateImage(id: string, data: { toothNumber?: string }): Promise<ImagingImage> {
  return apiPut(`/imaging-images/${id}`, data);
}

export async function uploadImage(file: File | Blob, data: { imagingStudyId: string; toothNumber?: string; fileName?: string }): Promise<ImagingImage> {
  const formData = new FormData();
  formData.append('file', file, data.fileName ?? 'capture.jpg');
  formData.append('imagingStudyId', data.imagingStudyId);
  if (data.toothNumber) formData.append('toothNumber', data.toothNumber);
  return apiUpload('/imaging-images/upload', formData);
}

export async function downloadImageOriginal(id: string): Promise<Blob> {
  return apiDownload(`/imaging-images/${id}/original`);
}

export async function downloadImageThumbnail(id: string): Promise<Blob> {
  return apiDownload(`/imaging-images/${id}/thumbnail`);
}

export async function getPatientImaging(patientId: string): Promise<StudyRow[]> {
  return apiGet(`/patients/${patientId}/imaging`);
}

export interface TwainScanResult {
  message: string;
  scanId: string;
  status: string;
  companionInstructions: {
    endpoint: string;
    wsEndpoint: string;
    patientId: string;
    tenantId: string;
  };
}

export async function initiateTwainScan(data: { patientId: string; toothNumber?: string; modality?: string }): Promise<TwainScanResult> {
  return apiPost('/imaging/twain/scan', data);
}

export async function getTwainScanStatus(scanId: string): Promise<{ scanId: string; status: string; message: string }> {
  return apiPost(`/imaging/twain/status/${scanId}`, {});
}
