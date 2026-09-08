import { useState, useMemo } from 'react';
import { X, Check, Trash2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@danta/ui/dialog';
import { Button } from '@danta/ui/button';
import { Input } from '@danta/ui/input';
import { Label } from '@danta/ui/label';
import { Select } from '@danta/ui/select';
import { Badge } from '@danta/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@danta/ui/tabs';
import {
  type ToothSurface,
  type ToothConditionConfig,
  type ClinicalStatus,
  type ToothConditionStatus,
  type FindingSeverity,
  SURFACE_LABELS,
  CLINICAL_STATUS_LABELS,
} from '@danta/schemas';
import {
  buildWedges,
  getToothGeometry,
  toothType,
  type ToothType,
} from '@danta/schemas';

const MODAL_TOOTH_VIEWBOX = 160;
const GLYPH_R = 26;

const SEVERITY_LABELS: Record<FindingSeverity, string> = {
  mild: 'Mild',
  moderate: 'Moderate',
  severe: 'Severe',
};

interface ToothModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tooth: string;
  isMaxilla: boolean;
  conditions: Array<{
    id: string;
    toothNumber: string;
    condition: string;
    surfaces: string[];
    surface?: string | null;
    status: string;
  }>;
  conditionConfigs: ToothConditionConfig[];
  moduleType?: string | null;
  saving?: boolean;
  onSubmit: (data: {
    conditionCode: string;
    surfaces: ToothSurface[];
    status: ToothConditionStatus;
    clinicalStatus: ClinicalStatus;
    severity?: FindingSeverity;
    notes?: string;
  }) => void;
  onDeleteCondition?: (id: string) => void;
}

function ToothSvg({
  fdi,
  isMaxilla,
  selectedSurfaces,
  existingSurfaces,
  onSurfaceClick,
}: {
  fdi: string;
  isMaxilla: boolean;
  selectedSurfaces: ToothSurface[];
  existingSurfaces: Partial<Record<ToothSurface, string>>;
  onSurfaceClick: (surface: ToothSurface) => void;
}) {
  const type: ToothType = toothType(fdi);
  const geo = getToothGeometry(type, isMaxilla);
  const scale = dentitionScale(fdi);
  const glyphCy = isMaxilla ? 70 : 170;

  const wedges = buildWedges(MODAL_TOOTH_VIEWBOX / 2, glyphCy, GLYPH_R);

  return (
    <svg viewBox={`0 0 ${MODAL_TOOTH_VIEWBOX} 240`} className="w-full h-full" role="img" aria-label={`Tooth ${fdi}`}>
      <g transform={`translate(${MODAL_TOOTH_VIEWBOX / 2 - 20 * scale}, ${isMaxilla ? 20 : 130}) scale(${scale})`}>
        {geo.roots.map((r, i) => (
          <path key={`root-${i}`} d={r} fill="#f1f5f9" stroke="#94a3b8" strokeWidth={1.2} />
        ))}
        <path d={geo.crown} fill="#ffffff" stroke="#94a3b8" strokeWidth={1.2} />
      </g>

      {wedges.map((w) => {
        const isSelected = selectedSurfaces.includes(w.surface);
        const existingCondition = existingSurfaces[w.surface];
        const fill = isSelected ? '#0d9488' : existingCondition ? existingCondition + '66' : 'transparent';
        const stroke = isSelected ? '#0d9488' : existingCondition ? existingCondition : '#cbd5e1';
        return (
          <path
            key={w.surface}
            d={w.path}
            fill={fill}
            stroke={stroke}
            strokeWidth={isSelected ? 2 : 1}
            className="cursor-pointer transition-colors hover:opacity-80"
            onClick={() => onSurfaceClick(w.surface)}
          />
        );
      })}

      {wedges.map((w) => {
        const isSelected = selectedSurfaces.includes(w.surface);
        if (!isSelected) return null;
        return (
          <text
            key={`label-${w.surface}`}
            x={w.centroid[0]}
            y={w.centroid[1]}
            textAnchor="middle"
            dominantBaseline="central"
            fontSize={7}
            fontWeight={600}
            fill="#ffffff"
            style={{ pointerEvents: 'none' }}
          >
            {SURFACE_LABELS[w.surface]?.slice(0, 3)}
          </text>
        );
      })}
    </svg>
  );
}

function dentitionScale(fdi: string): number {
  const n = Number(fdi);
  const quadrant = Math.floor(n / 10);
  return quadrant >= 5 && quadrant <= 8 ? 0.78 : 1;
}

export function ToothModal({
  open,
  onOpenChange,
  tooth,
  isMaxilla,
  conditions,
  conditionConfigs,
  moduleType,
  saving,
  onSubmit,
  onDeleteCondition,
}: ToothModalProps) {
  const activeConfigs = conditionConfigs.filter((c) => c.active);

  const [selectedSurfaces, setSelectedSurfaces] = useState<ToothSurface[]>([]);
  const [conditionCode, setConditionCode] = useState('');
  const [clinicalStatus, setClinicalStatus] = useState<ClinicalStatus>('planned');
  const [severity, setSeverity] = useState<FindingSeverity | ''>('');
  const [notes, setNotes] = useState('');
  const [tab, setTab] = useState<'chart' | 'history'>('chart');

  const selectedConfig = activeConfigs.find((c) => c.code === conditionCode);

  const existingSurfaces = useMemo(() => {
    const map: Partial<Record<ToothSurface, string>> = {};
    for (const c of conditions) {
      const cfg = conditionConfigs.find((cc) => cc.code === c.condition);
      const color = cfg?.color ?? '#64748b';
      for (const s of c.surfaces ?? []) {
        map[s as ToothSurface] = color;
      }
    }
    return map;
  }, [conditions, conditionConfigs]);

  const toothConditions = conditions.filter((c) => c.toothNumber === tooth || c.toothNumber === String(Number(tooth)));

  const toggleSurface = (surface: ToothSurface) => {
    setSelectedSurfaces((prev) =>
      prev.includes(surface) ? prev.filter((s) => s !== surface) : [...prev, surface],
    );
  };

  const handleSubmit = () => {
    if (!conditionCode) return;
    onSubmit({
      conditionCode,
      surfaces: selectedSurfaces,
      status: mapClinicalStatusToLegacy(clinicalStatus),
      clinicalStatus,
      ...(severity ? { severity: severity as FindingSeverity } : {}),
      ...(notes.trim() ? { notes: notes.trim() } : {}),
    });
    resetForm();
  };

  const handleClose = () => {
    resetForm();
    onOpenChange(false);
  };

  const resetForm = () => {
    setSelectedSurfaces([]);
    setConditionCode('');
    setClinicalStatus('planned');
    setSeverity('');
    setNotes('');
    setTab('chart');
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            Tooth {tooth}
            {moduleType && (
              <Badge variant="secondary" className="text-xs">
                {moduleType.replace('odontogram_', '')}
              </Badge>
            )}
          </DialogTitle>
          <DialogDescription>
            Select surfaces and a condition to record a finding
          </DialogDescription>
        </DialogHeader>

        <Tabs value={tab} onValueChange={(v) => setTab(v as 'chart' | 'history')} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="chart">Chart Finding</TabsTrigger>
            <TabsTrigger value="history">
              History {toothConditions.length > 0 && `(${toothConditions.length})`}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="chart" className="mt-4 space-y-4">
            <div className="grid gap-4 sm:grid-cols-[200px_1fr]">
              <div className="rounded-lg border bg-muted/30 p-2 flex items-center justify-center min-h-[260px]">
                <ToothSvg
                  fdi={tooth}
                  isMaxilla={isMaxilla}
                  selectedSurfaces={selectedSurfaces}
                  existingSurfaces={existingSurfaces}
                  onSurfaceClick={toggleSurface}
                />
              </div>

              <div className="space-y-3">
                <div className="space-y-1.5">
                  <Label>Condition</Label>
                  <Select value={conditionCode} onChange={(e) => setConditionCode(e.target.value)}>
                    <option value="">Select condition…</option>
                    {activeConfigs.map((cfg) => (
                      <option key={cfg.code} value={cfg.code}>
                        {cfg.name}
                      </option>
                    ))}
                  </Select>
                  {selectedConfig && (
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span className="inline-block h-3 w-3 rounded-sm" style={{ backgroundColor: selectedConfig.color }} />
                      {selectedConfig.category}
                      {selectedConfig.cdtCode && (
                        <span className="font-mono">· {selectedConfig.cdtCode}</span>
                      )}
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label>Clinical Status</Label>
                    <Select value={clinicalStatus} onChange={(e) => setClinicalStatus(e.target.value as ClinicalStatus)}>
                      {(Object.keys(CLINICAL_STATUS_LABELS) as ClinicalStatus[]).map((s) => (
                        <option key={s} value={s}>{CLINICAL_STATUS_LABELS[s]}</option>
                      ))}
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label>Severity</Label>
                    <Select value={severity} onChange={(e) => setSeverity(e.target.value as FindingSeverity | '')}>
                      <option value="">—</option>
                      {(Object.keys(SEVERITY_LABELS) as FindingSeverity[]).map((s) => (
                        <option key={s} value={s}>{SEVERITY_LABELS[s]}</option>
                      ))}
                    </Select>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label>Notes</Label>
                  <Input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Optional clinical note" />
                </div>

                {selectedSurfaces.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {selectedSurfaces.map((s) => (
                      <Badge key={s} variant="outline" className="gap-1">
                        {SURFACE_LABELS[s]}
                        <button type="button" onClick={() => toggleSurface(s)} className="hover:text-destructive">
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="history" className="mt-4">
            {toothConditions.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">No findings recorded for this tooth yet.</p>
            ) : (
              <ul className="space-y-2 max-h-[300px] overflow-y-auto">
                {toothConditions.map((c) => {
                  const cfg = conditionConfigs.find((cc) => cc.code === c.condition);
                  return (
                    <li key={c.id} className="flex items-center justify-between rounded-md border px-3 py-2 text-sm">
                      <span className="flex items-center gap-2">
                        <span className="inline-block h-3 w-3 rounded-full" style={{ backgroundColor: cfg?.color ?? '#64748b' }} />
                        <span className="font-medium">{cfg?.name ?? c.condition}</span>
                        {c.surfaces?.length > 0 && (
                          <span className="text-xs text-muted-foreground">{c.surfaces.map((s) => SURFACE_LABELS[s as ToothSurface] ?? s).join('+')}</span>
                        )}
                        <Badge variant={c.status === 'planned' ? 'default' : c.status === 'watch' ? 'secondary' : 'outline'} className="text-[10px]">
                          {c.status}
                        </Badge>
                      </span>
                      {onDeleteCondition && (
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onDeleteCondition(c.id)} aria-label="Delete">
                          <Trash2 className="h-3.5 w-3.5 text-destructive" />
                        </Button>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
          </TabsContent>
        </Tabs>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={!conditionCode || saving} className="gap-1.5">
            <Check className="h-4 w-4" />
            {saving ? 'Saving…' : 'Record Finding'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function mapClinicalStatusToLegacy(status: ClinicalStatus): ToothConditionStatus {
  switch (status) {
    case 'planned':
    case 'in_progress':
      return 'planned';
    case 'diagnosed':
      return 'watch';
    case 'existing':
    case 'accepted':
    case 'completed':
    case 'cancelled':
      return 'existing';
    default:
      return 'planned';
  }
}
