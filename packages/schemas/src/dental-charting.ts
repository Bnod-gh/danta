import { z } from 'zod';

export const ToothSurfaceSchema = z.enum(['mesial', 'distal', 'occlusal', 'buccal', 'lingual', 'root']);
export type ToothSurface = z.infer<typeof ToothSurfaceSchema>;

export const DentalConditionSchema = z.enum([
  'caries',
  'filling',
  'crown',
  'root_canal',
  'implant',
  'missing',
  'extraction',
  'veneer',
]);
export type DentalCondition = z.infer<typeof DentalConditionSchema>;

export const ToothConditionStatusSchema = z.enum(['planned', 'existing', 'watch']);
export type ToothConditionStatus = z.infer<typeof ToothConditionStatusSchema>;

export interface CdtTreatment {
  code: string;
  description: string;
  defaultFee: number;
}

/** Suggested ADA/CDT treatment per diagnosed condition; null = no planned treatment generated. */
export const CONDITION_CDT_MAP: Record<DentalCondition, CdtTreatment | null> = {
  caries: { code: 'D2392', description: 'Composite restoration — two surfaces', defaultFee: 220 },
  crown: { code: 'D2740', description: 'Crown — porcelain/ceramic', defaultFee: 1250 },
  root_canal: { code: 'D3330', description: 'Endodontic therapy — molar', defaultFee: 950 },
  implant: { code: 'D6010', description: 'Surgical placement of implant body', defaultFee: 3500 },
  extraction: { code: 'D7140', description: 'Extraction — erupted tooth or exposed root', defaultFee: 250 },
  veneer: { code: 'D2962', description: 'Veneer restoration — lab fabricated', defaultFee: 900 },
  filling: null,
  missing: null,
};

export const CONDITION_LABELS: Record<DentalCondition, string> = {
  caries: 'Caries',
  filling: 'Filling',
  crown: 'Crown',
  root_canal: 'Root Canal Therapy',
  implant: 'Implant',
  missing: 'Missing',
  extraction: 'Extraction Needed',
  veneer: 'Veneer',
};


/** Clinical-condition color key (UI). Single source of truth shared by the
 *  schema barrel and charting components. */
export const CONDITION_COLORS: Record<DentalCondition, string> = {
  caries: "#dc2626",
  filling: "#3b82f6",
  crown: "#d4a017",
  root_canal: "#9333ea",
  implant: "#475569",
  missing: "#94a3b8",
  extraction: "#ea580c",
  veneer: "#14b8a6",
};

export const SURFACE_LABELS: Record<ToothSurface, string> = {
  mesial: 'Mesial',
  distal: 'Distal',
  occlusal: 'Occlusal',
  buccal: 'Buccal',
  lingual: 'Lingual',
  root: 'Root',
};

/** Universal numbering runs 1-32: upper right third molar (1) around to lower right third molar (32). */
export const UNIVERSAL_TEETH = Array.from({ length: 32 }, (_, i) => i + 1);

/** FDI/ISO two-digit notation: quadrants 1 (UR), 2 (UL), 3 (LL), 4 (LR); position 1 = central incisor. */
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
export const MAXILLA_RENDER_ORDER = UNIVERSAL_TEETH.slice(0, 16);
export const MANDIBLE_RENDER_ORDER = [...UNIVERSAL_TEETH].slice(16, 32).reverse();
