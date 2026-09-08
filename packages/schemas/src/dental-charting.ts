import { z } from 'zod';

export const ToothSurfaceSchema = z.enum(['mesial', 'distal', 'occlusal', 'buccal', 'lingual', 'root']);
export type ToothSurface = z.infer<typeof ToothSurfaceSchema>;

export const FDI_PERMANENT = /^(1[1-8]|2[1-8]|3[1-8]|4[1-8])$/;
export const FDI_PRIMARY = /^(5[1-5]|6[1-5]|7[1-5]|8[1-5])$/;

/** Accepts an FDI number (permanent or primary, governed by `dentition`) or a
 *  Universal number (1-32). Default validates permanent only for backward compat. */
export function isValidToothNumber(value: string, dentition: 'permanent' | 'primary' = 'permanent'): boolean {
  if (!/^\d{1,2}$/.test(value)) return false;
  if (value.length === 2) {
    return dentition === 'primary' ? FDI_PRIMARY.test(value) : FDI_PERMANENT.test(value);
  }
  try {
    universalToFdi(Number(value));
    return true;
  } catch {
    return false;
  }
}

export const ToothNumberSchema = z
  .string()
  .refine((v) => isValidToothNumber(v), 'Tooth must be a valid FDI number (e.g. 16) or Universal number (1-32)');

export const FindingSeveritySchema = z.enum(['mild', 'moderate', 'severe']);
export type FindingSeverity = z.infer<typeof FindingSeveritySchema>;

export const DentitionSchema = z.enum(['permanent', 'primary']);
export type Dentition = z.infer<typeof DentitionSchema>;

export const FindingScopeSchema = z.enum(['tooth', 'mouth']);
export type FindingScope = z.infer<typeof FindingScopeSchema>;

export const ClinicalStatusSchema = z.enum(['planned', 'in_progress', 'diagnosed', 'existing', 'accepted', 'completed', 'cancelled']);
export type ClinicalStatus = z.infer<typeof ClinicalStatusSchema>;

/** Legacy tooth condition statuses (pre-module-system values). */
export const ToothConditionStatusSchema = z.enum(['planned', 'existing', 'watch']);
export type ToothConditionStatus = z.infer<typeof ToothConditionStatusSchema>;

/** User-facing labels for tooth surfaces. Conditions are tenant-configurable; surfaces are stable. */
export const SURFACE_LABELS: Record<ToothSurface, string> = {
  mesial: 'Mesial',
  distal: 'Distal',
  occlusal: 'Occlusal',
  buccal: 'Buccal',
  lingual: 'Lingual',
  root: 'Root',
};

/** User-facing labels for the rich clinical-status lifecycle. */
export const CLINICAL_STATUS_LABELS: Record<ClinicalStatus, string> = {
  planned: 'Planned',
  in_progress: 'In progress',
  diagnosed: 'Diagnosed',
  existing: 'Existing',
  accepted: 'Accepted',
  completed: 'Completed',
  cancelled: 'Cancelled',
};

export function universalToFdi(universal: number): number {
  if (universal < 1 || universal > 32) throw new Error(`Invalid universal tooth number: ${universal}`);
  if (universal <= 8) return 10 + (9 - universal);
  if (universal <= 16) return 20 + (universal - 8);
  if (universal <= 24) return 39 - (universal - 16);
  return 16 + universal;
}

export function fdiToUniversal(fdi: number): number {
  const quadrant = Math.floor(fdi / 10);
  const position = fdi % 10;
  if (position < 1 || position > 8 || quadrant < 1 || quadrant > 4) {
    throw new Error(`Invalid FDI tooth number: ${fdi}`);
  }
  switch (quadrant) {
    case 1:
      return 9 - position;
    case 2:
      return 8 + position;
    case 3:
      return 25 - position;
    default:
      return 24 + position;
  }
}

export function formatToothLabel(universal: number, system: 'universal' | 'fdi'): string {
  return system === 'universal' ? String(universal) : String(universalToFdi(universal));
}

/**
 * Render order per arch, left-to-right from the operator's view of the patient:
 * maxilla renders patient-right → patient-left (universal 1…16),
 * mandible renders patient-left → patient-right (universal 32…17).
 */
export const MAXILLA_RENDER_ORDER = Array.from({ length: 16 }, (_, i) => i + 1);
export const MANDIBLE_RENDER_ORDER = Array.from({ length: 16 }, (_, i) => 32 - i);