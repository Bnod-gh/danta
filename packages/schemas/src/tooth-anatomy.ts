import type { ToothSurface } from "./dental-charting";

export type ToothType = "incisor" | "canine" | "premolar" | "molar";

/** Classify an FDI tooth number (e.g. "16", "31") into its anatomical type. */
export function toothType(fdi: string): ToothType {
  const n = Number(fdi);
  const position = n % 10;
  if (position <= 2) return "incisor";
  if (position === 3) return "canine";
  if (position <= 5) return "premolar";
  return "molar";
}

/** Is this FDI number a primary (deciduous) tooth — quadrants 5-8. */
export function isPrimary(fdi: string): boolean {
  const n = Number(fdi);
  const quadrant = Math.floor(n / 10);
  return quadrant >= 5 && quadrant <= 8;
}

/** Primary teeth render with the same type map but we mark them for sizing. */
export const PRIMARY_SCALE = 0.78;

/** Permanent FDI teeth, ordered per arch for left-to-right rendering. */
export const MAXILLA_FDI = ["18","17","16","15","14","13","12","11","21","22","23","24","25","26","27","28"];
export const MANDIBLE_FDI = ["48","47","46","45","44","43","42","41","31","32","33","34","35","36","37","38"];

/** Primary FDI teeth per arch. */
export const PRIMARY_MAXILLA = ["55","54","53","52","51","61","62","63","64","65"];
export const PRIMARY_MANDIBLE = ["85","84","83","82","81","71","72","73","74","75"];

/** Anatomical silhouette paths (viewBox 0 0 40 64). Upper teeth hang down
 *  (crown at top, roots pointing up); lower teeth rise (crown at bottom,
 *  roots pointing down). Crown roughly y=4..30, roots y=30..60. */
interface Silhouette {
  crown: string;
  roots: string[];
}

const INCISOR_UPPER: Silhouette = {
  crown: "M7,5 Q5,3 9,2 L31,2 Q35,3 33,5 L32,12 Q32,14 30,14 L28,14 Q28,8 26,7 L16,7 Q14,8 13,14 L12,14 Q10,14 10,12 L9,8 Q8,5 7,5 Z M11,16 Q9,18 9,22 L8,28 Q8,30 10,30 L12,30 Q12,28 13,26 L14,22 Q14,20 16,19 L24,19 Q26,20 26,22 L27,26 Q28,28 28,30 L30,30 Q32,30 32,28 L31,22 Q31,18 29,16 Z",
  roots: ["M13,30 Q13,42 14,52 Q14,58 16,60 Q18,62 20,60 Q21,56 20,48 L20,30"],
};

const INCISOR_LOWER: Silhouette = {
  crown: "M7,36 Q8,34 10,34 L12,34 L13,56 Q13,58 15,58 L25,58 Q27,58 27,56 L28,34 L30,34 Q32,34 33,36 L34,38 Q34,42 30,42 L10,42 Q6,42 6,38 Z",
  roots: ["M20,34 Q20,16 18,6 Q17,2 14,2 Q11,2 11,6 Q12,16 12,34"],
};

const CANINE_UPPER: Silhouette = {
  crown: "M8,6 Q8,2 12,2 L28,2 Q32,2 32,6 Q34,10 33,14 L31,28 Q30,32 27,32 L26,32 L25,10 Q25,6 22,6 L18,6 Q15,6 15,10 L14,32 L13,32 Q10,32 9,28 L7,14 Q6,10 8,6 Z",
  roots: ["M15,32 Q14,50 16,60 Q17,64 20,64 Q23,64 24,60 Q26,50 25,32"],
};

const CANINE_LOWER: Silhouette = {
  crown: "M9,32 Q10,28 13,28 L14,28 L15,54 Q15,58 18,58 L22,58 Q25,58 25,54 L26,28 L27,28 Q30,28 31,32 L32,36 Q32,40 30,40 L10,40 Q8,40 8,36 Z",
  roots: ["M18,28 Q17,12 19,4 Q20,0 22,0 Q24,0 25,4 Q27,12 26,28"],
};

const PREMOLAR_UPPER: Silhouette = {
  crown: "M7,6 Q7,2 11,2 L29,2 Q33,2 33,6 L32,12 Q33,18 31,22 L30,28 Q30,32 27,32 L25,32 Q22,32 22,28 L21,12 Q21,8 18,8 L14,8 Q12,8 12,12 L13,32 L13,32 Q11,32 10,28 Q8,32 7,28 L8,22 Q6,18 7,12 Z",
  roots: ["M13,32 Q12,44 14,56 Q15,60 18,60 Q20,60 21,56 L21,40","M22,32 Q23,44 22,56 Q23,60 26,60 Q28,60 29,56 Q30,46 28,32"],
};

const PREMOLAR_LOWER: Silhouette = {
  crown: "M8,32 Q9,28 12,28 L14,28 Q16,28 16,32 L17,52 Q17,56 20,56 L24,56 Q27,56 27,52 L28,32 Q28,28 30,28 L31,28 Q32,30 32,32 L32,38 Q32,42 29,42 L11,42 Q8,42 8,38 Z",
  roots: ["M16,28 Q15,18 17,8 Q18,4 21,4 Q23,4 24,8 Q25,18 24,28","M24,28 Q24,18 25,8 Q26,4 28,4 Q30,2 30,10 Q30,20 28,28"],
};

const MOLAR_UPPER: Silhouette = {
  crown: "M4,8 Q4,2 10,2 L30,2 Q36,2 36,8 L35,16 Q36,22 34,26 L32,32 Q32,36 28,36 L26,36 Q24,36 23,32 L22,12 Q22,8 19,8 L15,8 Q12,8 12,12 L10,32 L10,32 Q8,36 6,36 L4,36 Q2,34 2,30 L3,24 Q2,18 3,12 Z",
  roots: ["M10,36 Q8,48 10,60 Q12,64 15,64 Q17,64 18,60 L18,44","M20,36 Q20,50 21,60 Q22,64 26,64 Q29,64 30,60 Q31,50 30,36","M14,36 Q14,46 13,58 Q12,62 9,62 Q7,62 6,58"],
};

const MOLAR_LOWER: Silhouette = {
  crown: "M4,30 Q4,26 6,24 L8,22 Q8,18 10,14 L12,8 Q12,4 15,4 L25,4 Q28,4 28,8 L30,14 Q32,18 32,22 L33,24 Q36,26 36,30 L36,36 Q36,42 32,42 L8,42 Q4,42 4,36 Z",
  roots: ["M10,22 Q8,14 10,4 Q11,0 14,0 Q17,0 18,4 Q18,12 17,22","M22,22 Q22,12 23,4 Q24,0 27,0 Q30,0 31,4 Q32,14 30,22","M15,22 Q14,14 15,6 Q16,2 19,2 Q21,2 22,6"],
};

const SILHOUETTES: Record<ToothType, { upper: Silhouette; lower: Silhouette }> = {
  incisor: { upper: INCISOR_UPPER, lower: INCISOR_LOWER },
  canine: { upper: CANINE_UPPER, lower: CANINE_LOWER },
  premolar: { upper: PREMOLAR_UPPER, lower: PREMOLAR_LOWER },
  molar: { upper: MOLAR_UPPER, lower: MOLAR_LOWER },
};

export interface ToothGeometry {
  crown: string;
  roots: string[];
  /** Suggested transform origin for this tooth in the arch layout. */
  crownCenter: [number, number];
  cuspY: number;
}

export function getToothGeometry(type: ToothType, isMaxilla: boolean): ToothGeometry {
  const set = isMaxilla ? SILHOUETTES[type].upper : SILHOUETTES[type].lower;
  return {
    crown: set.crown,
    roots: set.roots,
    crownCenter: [20, isMaxilla ? 18 : 36],
    cuspY: isMaxilla ? 40 : 24,
  };
}

/** Build the radial 5-surface glyph geometry for a tooth status indicator.
 *  Returns wedge SVG path data (arc-based pentagon) keyed by surface, plus
 *  the centre coordinates for whole-tooth overlays. */
export interface SurfaceWedge {
  surface: ToothSurface;
  path: string;
  centroid: [number, number];
}

export function buildWedges(cx: number, cy: number, r: number): SurfaceWedge[] {
  // Order arranged radially: occlusal at top, then clockwise buccal, distal, lingual, mesial.
  const order: ToothSurface[] = ["occlusal", "buccal", "distal", "lingual", "mesial"];
  const startAngles = [-90, -18, 54, 126, 198]; // degrees, 72deg apart
  const inner = r * 0.42;
  return order.map((surface, i) => {
    const a0 = (startAngles[i] * Math.PI) / 180;
    const a1 = ((startAngles[i] + 72) * Math.PI) / 180;
    const outer0 = [cx + r * Math.cos(a0), cy + r * Math.sin(a0)];
    const outer1 = [cx + r * Math.cos(a1), cy + r * Math.sin(a1)];
    const inner0 = [cx + inner * Math.cos(a1), cy + inner * Math.sin(a1)];
    const inner1 = [cx + inner * Math.cos(a0), cy + inner * Math.sin(a0)];
    const large = 72 > 180 ? 1 : 0;
    const path = [
      `M ${outer0[0].toFixed(2)} ${outer0[1].toFixed(2)}`,
      `A ${r} ${r} 0 ${large} 1 ${outer1[0].toFixed(2)} ${outer1[1].toFixed(2)}`,
      `L ${inner0[0].toFixed(2)} ${inner0[1].toFixed(2)}`,
      `A ${inner} ${inner} 0 ${large} 0 ${inner1[0].toFixed(2)} ${inner1[1].toFixed(2)}`,
      "Z",
    ].join(" ");
    const mid = ((startAngles[i] + 36) * Math.PI) / 180;
    const centroid: [number, number] = [
      cx + ((r + inner) / 2) * Math.cos(mid),
      cy + ((r + inner) / 2) * Math.sin(mid),
    ];
    return { surface, path, centroid };
  });
}