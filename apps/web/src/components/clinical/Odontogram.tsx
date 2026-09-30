import React, { useMemo } from "react";
import { cn } from "@danta/ui/utils";
import type { ToothConditionConfig, ToothCondition } from "@danta/schemas";
import {
  MAXILLA_FDI,
  MANDIBLE_FDI,
  PRIMARY_MAXILLA,
  PRIMARY_MANDIBLE,
  buildWedges,
  getToothGeometry,
  toothType,
  fdiToUniversal,
  type ToothType,
  type Dentition,
  type ToothSurface,
} from "@danta/schemas";

export interface OdontogramSelection {
  tooth: string;
  surface: ToothSurface | null;
}

export interface OdontogramModuleTab {
  type: string;
  displayName: string;
}

export interface OdontogramProps {
  conditions: ToothCondition[];
  numbering: "universal" | "fdi";
  selected?: OdontogramSelection | null;
  onSelect?: (selection: OdontogramSelection) => void;
  dentition?: Dentition;
  /** Active clinical modules for the current resource; renders module tabs when provided. */
  moduleTabs?: OdontogramModuleTab[];
  /** Currently selected module type (drives tooth highlighting + context). */
  activeModuleType?: string | null;
  onModuleChange?: (type: string | null) => void;
  /** When provided, clicking a tooth opens a modal via this callback instead of (or in addition to) onSelect. */
  onToothClick?: (tooth: string, isMaxilla: boolean) => void;
  /** Condition configs used for colors/labels in the odontogram. */
  conditionConfigMap?: Record<string, ToothConditionConfig>;
}

const GLYPH_R = 11;
const TOOTH_SPACING = 58;

function formatLabel(fdi: string, numbering: "universal" | "fdi"): string {
  if (numbering === "universal") {
    const n = Number(fdi);
    if (!Number.isFinite(n)) return fdi;
    try {
      const u = fdiToUniversal(n);
      return String(u);
    } catch {
      return fdi;
    }
  }
  return fdi;
}

interface ToothState {
  conditions: ToothCondition[];
  surfaces: Partial<Record<ToothSurface, { condition: string; color: string; status: string }>>;
  wholeTooth: { condition: string; color: string } | null;
  hasPlanned: boolean;
  hasModule: boolean;
}

const WHOLE_TOOTH_CONDITIONS = ["missing", "implant", "crown", "extraction", "root_canal"];

function deriveState(conditions: ToothCondition[], tooth: string, activeModuleType?: string | null, conditionConfigMap?: Record<string, ToothConditionConfig>): ToothState {
  const list = conditions.filter((c) => c.toothNumber === tooth || c.toothNumber === String(Number(tooth)));
  const surfaces: ToothState["surfaces"] = {};
  let wholeTooth: ToothState["wholeTooth"] = null;
  let hasPlanned = false;
  let hasModule = false;
  for (const c of list) {
    if (c.status === "planned") hasPlanned = true;
    if (activeModuleType && c.clinicalModule === activeModuleType) hasModule = true;
    const cfg = conditionConfigMap?.[c.condition];
    const color = cfg?.color ?? '#64748b';
    for (const s of c.surfaces ?? []) {
      surfaces[s] = { condition: c.condition, color, status: c.status };
    }
    if (WHOLE_TOOTH_CONDITIONS.includes(c.condition) && (c.surfaces?.length ?? 0) === 0) {
      wholeTooth = { condition: c.condition, color };
    }
  }
  return { conditions: list, surfaces, wholeTooth, hasPlanned, hasModule };
}

function surfaceFill(surf: { color: string; status: string } | undefined): { fill: string; dashed: boolean; stroke?: string } {
  if (!surf) return { fill: "transparent", dashed: false };
  const { color, status } = surf;
  if (status === "planned" || status === "watch") {
    return { fill: color + "33", dashed: true, stroke: "#f59e0b" };
  }
  return { fill: color, dashed: false };
}

interface ArchLayout {
  teeth: string[];
  isMaxilla: boolean;
}

function Overlays({ state, cx, cy }: { state: ToothState; cx: number; cy: number }) {
  const { wholeTooth, conditions } = state;
  const nodes: React.ReactNode[] = [];
  if (wholeTooth?.condition === "missing") {
    nodes.push(
      <g key="missing" stroke="#64748b" strokeWidth={2.4} style={{ pointerEvents: "none" }}>
        <line x1={cx - 10} y1={cy - 10} x2={cx + 10} y2={cy + 10} />
        <line x1={cx + 10} y1={cy - 10} x2={cx - 10} y2={cy + 10} />
      </g>
    );
  }
  if (wholeTooth?.condition === "implant") {
    nodes.push(
      <g key="implant" style={{ pointerEvents: "none" }}>
        <circle cx={cx} cy={cy} r={5} fill="#475569" />
        <line x1={cx - 3} y1={cy - 8} x2={cx + 3} y2={cy - 8} stroke="#f8fafc" strokeWidth={1.2} />
        <line x1={cx - 3} y1={cy + 8} x2={cx + 3} y2={cy + 8} stroke="#f8fafc" strokeWidth={1.2} />
      </g>
    );
  }
  if (wholeTooth?.condition === "root_canal") {
    nodes.push(
      <g key="rct" stroke="#1d4ed8" strokeWidth={1.6} fill="none" style={{ pointerEvents: "none" }}>
        <line x1={cx - 4} y1={cy - 6} x2={cx - 4} y2={cy + 6} />
        <line x1={cx} y1={cy - 8} x2={cx} y2={cy + 8} />
        <line x1={cx + 4} y1={cy - 6} x2={cx + 4} y2={cy + 6} />
      </g>
    );
  }
  const caries = conditions.find((c) => c.condition === "caries" && (c.surfaces?.length ?? 0) === 0);
  if (caries) {
    for (let i = 0; i < 3; i++) {
      nodes.push(<circle key={`dot-${i}`} cx={cx - 5 + i * 5} cy={cy + 12} r={1.6} fill="#dc2626" style={{ pointerEvents: "none" }} />);
    }
  }
  return <>{nodes}</>;
}

function ToothSilhouette({ fdi, isMaxilla, scale }: { fdi: string; isMaxilla: boolean; scale: number }) {
  const type: ToothType = toothType(fdi);
  return (
    <g transform={`translate(0,0) scale(${scale})`}>
      {getToothGeometry(type, isMaxilla).roots.map((r, i) => (
        <path key={`root-${i}`} d={r} fill="#f1f5f9" stroke="#94a3b8" strokeWidth={1.4} />
      ))}
      <path d={getToothGeometry(type, isMaxilla).crown} fill="#ffffff" stroke="#94a3b8" strokeWidth={1.4} />
    </g>
  );
}

function Glyph({ state, cx, cy }: { state: ToothState; cx: number; cy: number }) {
  const wedges = buildWedges(cx, cy, GLYPH_R);
  return (
    <g>
      {wedges.map((w) => {
        const info = surfaceFill(state.surfaces[w.surface]);
        return (
          <path
            key={w.surface}
            d={w.path}
            fill={info.fill}
            stroke={info.stroke ?? "#cbd5e1"}
            strokeWidth={info.dashed ? 1.4 : 0.8}
            strokeDasharray={info.dashed ? "2 1.5" : undefined}
          />
        );
      })}
      {state.wholeTooth && (
        <circle cx={cx} cy={cy} r={GLYPH_R * 0.38} fill={state.wholeTooth.color} opacity={0.85} />
      )}
      {state.hasPlanned && !state.wholeTooth && (
        <circle cx={cx} cy={cy} r={GLYPH_R + 1.5} fill="none" stroke="#f59e0b" strokeWidth={1} strokeDasharray="2 2" />
      )}
    </g>
  );
}

const Tooth = React.memo(function Tooth({
  fdi,
  isMaxilla,
  layoutX,
  state,
  numbering,
  isSelected,
  onSelect,
  onToothClick,
  dentition,
  conditionConfigMap,
}: {
  fdi: string;
  isMaxilla: boolean;
  layoutX: number;
  state: ToothState;
  numbering: "universal" | "fdi";
  isSelected: boolean;
  onSelect?: (s: OdontogramSelection) => void;
  onToothClick?: (tooth: string, isMaxilla: boolean) => void;
  dentition: Dentition;
  conditionConfigMap: Record<string, ToothConditionConfig>;
}) {
  const scale = dentition === "primary" ? 0.78 : 1;
  const baseY = isMaxilla ? 60 : 300;
  const crownCenterY = isMaxilla ? baseY + 8 : baseY + 36;
  const glyphY = isMaxilla ? baseY + 96 : baseY - 58;
  const labelY = isMaxilla ? baseY + 124 : baseY - 78;


  const announce = state.conditions.length
    ? `Tooth ${formatLabel(fdi, numbering)}: ${state.conditions.map((c) => `${conditionConfigMap[c.condition]?.name ?? c.condition} (${c.status})`).join(", ")}`
    : `Tooth ${formatLabel(fdi, numbering)}, no findings`;

  const handleClick = (e: React.MouseEvent<SVGGElement>) => {
    const target = e.target as SVGElement;
    const surface = (target.dataset?.surface as ToothSurface | undefined) ?? null;
    if (surface) {
      onSelect?.({ tooth: fdi, surface });
    } else if (onToothClick) {
      onToothClick(fdi, isMaxilla);
    } else {
      onSelect?.({ tooth: fdi, surface: null });
    }
  };

  return (
    <g
      role="button"
      tabIndex={0}
      aria-label={announce}
      aria-pressed={isSelected}
      onClick={handleClick}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onSelect?.({ tooth: fdi, surface: null });
        }
      }}
      className={cn(
        "cursor-pointer focus-visible:outline-none",
        isSelected ? "[&_path]:stroke-[1.6]" : ""
      )}
      transform={`translate(${layoutX}, 0)`}
    >
      <g transform={`translate(20, ${crownCenterY}) scale(${scale})${isMaxilla ? '' : ' translate(0, 64) scale(1, -1)'}`}>
        <ToothSilhouette fdi={fdi} isMaxilla={isMaxilla} scale={1} />
        <Overlays state={state} cx={20} cy={isMaxilla ? 20 : 44} />
      </g>
      <Glyph state={state} cx={32} cy={glyphY} />
      {state.hasModule && (
        <circle cx={32} cy={glyphY} r={GLYPH_R + 5} fill="none" stroke="#0d9488" strokeWidth={1.5} opacity={0.9} />
      )}
    </g>
  );
})
;

function ArchRow({ layout, conditions, numbering, selected, onSelect, dentition, activeModuleType, onToothClick, conditionConfigMap }: {
  layout: ArchLayout;
  conditions: ToothCondition[];
  numbering: "universal" | "fdi";
  selected?: OdontogramSelection | null;
  onSelect?: (s: OdontogramSelection) => void;
  dentition: Dentition;
  activeModuleType?: string | null;
  onToothClick?: (tooth: string, isMaxilla: boolean) => void;
  conditionConfigMap: Record<string, ToothConditionConfig>;
}) {
  const { teeth, isMaxilla } = layout;
  const totalWidth = (teeth.length - 1) * TOOTH_SPACING + 64;
  const startX = (1000 - totalWidth) / 2;
  return (
    <g>
      {teeth.map((fdi) => {
        const x = startX + teeth.indexOf(fdi) * TOOTH_SPACING;
        return (
          <Tooth
            key={fdi}
            fdi={fdi}
            isMaxilla={isMaxilla}
            layoutX={x}
            state={deriveState(conditions, fdi, activeModuleType, conditionConfigMap)}
            numbering={numbering}
            isSelected={selected?.tooth === fdi}
            onSelect={onSelect}
            onToothClick={onToothClick}
            dentition={dentition}
            conditionConfigMap={conditionConfigMap}
          />
        );
      })}
    </g>
  );
}

export function Odontogram({ conditions, numbering, selected, onSelect, dentition = "permanent", moduleTabs, activeModuleType, onModuleChange, onToothClick, conditionConfigMap = {} }: OdontogramProps) {
  const layouts: ArchLayout[] = useMemo(() => {
    if (dentition === "primary") {
      return [
        { teeth: PRIMARY_MAXILLA, isMaxilla: true },
        { teeth: PRIMARY_MANDIBLE, isMaxilla: false },
      ];
    }
    return [
      { teeth: MAXILLA_FDI, isMaxilla: true },
      { teeth: MANDIBLE_FDI, isMaxilla: false },
    ];
  }, [dentition]);

  return (
    <div className="space-y-2">
      {moduleTabs && moduleTabs.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5 px-2">
          <span className="text-xs font-medium text-muted-foreground">Module:</span>
          <button
            type="button"
            onClick={() => onModuleChange?.(null)}
            className={cn(
              "rounded-full px-3 py-1 text-xs font-medium transition-colors",
              !activeModuleType ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/70",
            )}
          >
            All
          </button>
          {moduleTabs.map((tab) => (
            <button
              key={tab.type}
              type="button"
              onClick={() => onModuleChange?.(tab.type)}
              className={cn(
                "rounded-full px-3 py-1 text-xs font-medium transition-colors",
                activeModuleType === tab.type ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/70",
              )}
            >
              {tab.displayName}
            </button>
          ))}
        </div>
      )}
      <div className="overflow-x-auto rounded-lg border bg-background">
        <svg viewBox="0 0 1000 480" className="w-full select-none" role="img" aria-label="Dental odontogram">
          <text x={24} y={34} fontSize={13} fontWeight={700} fill="#334155">Maxilla</text>
          <text x={24} y={460} fontSize={13} fontWeight={700} fill="#334155">Mandible</text>
          <line x1={500} y1={40} x2={500} y2={150} stroke="#e2e8f0" strokeDasharray="4 4" />
          <line x1={500} y1={340} x2={500} y2={445} stroke="#e2e8f0" strokeDasharray="4 4" />
          {layouts.map((layout, i) => (
            <g key={i} transform={`translate(0, ${i === 0 ? 0 : 200})`}>
              <ArchRow
                layout={layout}
                conditions={conditions}
                numbering={numbering}
                selected={selected}
                onSelect={onSelect}
                dentition={dentition}
                activeModuleType={activeModuleType}
                onToothClick={onToothClick}
                conditionConfigMap={conditionConfigMap}
              />
            </g>
          ))}
        </svg>
      </div>
    </div>
  );
}
