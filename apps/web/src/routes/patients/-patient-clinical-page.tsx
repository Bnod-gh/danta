import { useEffect, useMemo, useRef, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Link } from '@tanstack/react-router';
import { ArrowLeft, RefreshCw, Radiation, Camera } from 'lucide-react';
import { Button } from '@danta/ui/button';
import { Badge } from '@danta/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@danta/ui/card';
import { Input } from '@danta/ui/input';
import { Label } from '@danta/ui/label';
import { Select } from '@danta/ui/select';
import { Skeleton } from '@danta/ui/skeleton';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@danta/ui/dialog';
import { toast } from 'sonner';
import { Odontogram, type OdontogramSelection } from '../../components/clinical/Odontogram';
import { PatientImagingGallery } from '../../components/imaging/PatientImagingGallery';
import { CameraCaptureDialog } from '../../components/imaging/CameraCaptureDialog';
import { MAXILLA_FDI, MANDIBLE_FDI } from '@danta/schemas';
import { CONDITION_LABELS, SURFACE_LABELS, fdiToUniversal, type DentalCondition, type ToothSurface } from '@danta/schemas';
import { tenantPath } from '../../lib/tenant-routing';
import { useAuth } from '../../lib/auth-context';
import { getDentalCharts, createDentalChart, addToothCondition, deleteToothCondition } from '../../lib/api/dental-charts';
import {
  getClinicalOdontogram,
  getClinicalOdontogramAt,
  getToothHistory,
  type ClinicalTimelineEventVM,
} from '../../lib/api/patient-clinical';

interface ChartFindingVM {
  id: string;
  toothNumber: string;
  condition: string;
  surface: string | null;
  surfaces: string[];
  status: string;
  severity?: string | null;
}

/** Chart component renders Universal numbering; normalise FDI rows for display. */
function toUniversal(toothNumber: string): number | null {
  const n = Number(toothNumber);
  if (!Number.isFinite(n)) return null;
  if (/^\d{2}$/.test(toothNumber)) {
    try { return fdiToUniversal(n); } catch { return null; }
  }
  if (n >= 1 && n <= 32) return n;
  return null;
}

function mapFindings(findings: unknown[]): ChartFindingVM[] {
  return findings.map((raw) => {
    const finding = raw as { id: string; toothNumber: string; condition: string; surface?: string | null; surfaces?: string[]; status: string; severity?: string | null };
    return {
      id: finding.id,
      toothNumber: String(toUniversal(finding.toothNumber) ?? ''),
      condition: finding.condition,
      surface: finding.surfaces?.[0] ?? finding.surface ?? null,
      surfaces: finding.surfaces ?? [],
      status: finding.status,
      severity: finding.severity,
    };
  }).filter((finding) => finding.toothNumber !== '');
}

const FINDING_OPTIONS: Array<{ value: DentalCondition; label: string }> = (
  Object.entries(CONDITION_LABELS) as Array<[DentalCondition, string]>
).map(([value, label]) => ({ value, label }));

function AddFindingDialog({ patientId, tooth, surface, open, onOpenChange }: {
  patientId: string;
  tooth: string;
  surface: ToothSurface | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const queryClient = useQueryClient();
  const [condition, setCondition] = useState<DentalCondition>('caries');
  const [findingSurface, setFindingSurface] = useState<ToothSurface | ''>(surface ?? '');
  const [severity, setSeverity] = useState<'mild' | 'moderate' | 'severe'>('moderate');
  const [notes, setNotes] = useState('');
  const [status, setStatus] = useState<'planned' | 'existing' | 'watch'>('existing');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) setFindingSurface(surface ?? '');
  }, [open, surface]);

  const submit = async () => {
    setSaving(true);
    try {
      const charts = await getDentalCharts(patientId);
      let chartId = charts?.[0]?.id;
      if (!chartId) {
        const created = await createDentalChart({ patientId });
        chartId = created.id;
      }
      await addToothCondition({
        dentalChartId: chartId,
        toothNumber: tooth,
        condition,
        scope: "tooth",
        dentition: "permanent",
        ...(findingSurface ? { surfaces: [findingSurface] } : {}),
        severity,
        status,
        ...(notes.trim() ? { notes: notes.trim() } : {}),
      });
      toast.success(`Finding recorded on tooth ${tooth}`);
      queryClient.invalidateQueries({ queryKey: ['clinical-odontogram', patientId] });
      queryClient.invalidateQueries({ queryKey: ['patient-tooth-history', patientId] });
      onOpenChange(false);
    } catch (error) {
      toast.error(error instanceof Error && error.message ? error.message : 'Could not record the finding');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add finding — tooth {tooth}</DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="fnd-condition">Finding</Label>
            <Select id="fnd-condition" value={condition} onChange={(e) => setCondition(e.target.value as DentalCondition)}>
              {FINDING_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="fnd-surface">Surface</Label>
            <Select id="fnd-surface" value={findingSurface} onChange={(e) => setFindingSurface(e.target.value as ToothSurface | '')}>
              <option value="">Whole tooth</option>
              {(Object.entries(SURFACE_LABELS) as Array<[ToothSurface, string]>).map(([key, label]) => (
                <option key={key} value={key}>{label}</option>
              ))}
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="fnd-severity">Severity</Label>
            <Select id="fnd-severity" value={severity} onChange={(e) => setSeverity(e.target.value as typeof severity)}>
              <option value="mild">Mild</option>
              <option value="moderate">Moderate</option>
              <option value="severe">Severe</option>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="fnd-status">Classification</Label>
            <Select id="fnd-status" value={status} onChange={(e) => setStatus(e.target.value as typeof status)}>
              <option value="existing">Existing condition</option>
              <option value="watch">Watch</option>
              <option value="planned">Needs treatment</option>
            </Select>
          </div>
          <div className="col-span-2 space-y-1.5">
            <Label htmlFor="fnd-notes">Notes</Label>
            <Input id="fnd-notes" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Optional clinical note" />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>Cancel</Button>
          <Button onClick={submit} disabled={saving}>{saving ? 'Saving…' : 'Record finding'}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

interface OdontogramPayload {
  teeth: Record<string, { findings: unknown[]; treatments: unknown[] }>;
}

export function PatientClinicalPage({ patientId }: { patientId: string }) {
  const { permissions } = useAuth();
  const canChart = permissions.includes('dental_chart:update');

  const initialParams = useMemo(() => new URLSearchParams(window.location.search), []);
  const [asOfDate, setAsOfDate] = useState(initialParams.get('asof') ?? '');
  const [selection, setSelection] = useState<OdontogramSelection | null>(
    initialParams.get('tooth') ? { tooth: (initialParams.get('tooth') ?? ''), surface: null } : null,
  );
  const [addOpen, setAddOpen] = useState(false);
  const [cameraOpen, setCameraOpen] = useState(false);

  // Session-scoped undo/redo for findings added in this visit (spec §36):
  // undo soft-deletes the finding (a compensating server mutation), redo re-records it.
  const undoStack = useRef<Array<{ conditionId: string; payload: Parameters<typeof addToothCondition>[0] }>>([]);
  const redoStack = useRef<Array<{ conditionId: string; payload: Parameters<typeof addToothCondition>[0] }>>([]);
  const queryClient = useQueryClient();

  const refreshChart = () => {
    queryClient.invalidateQueries({ queryKey: ['clinical-odontogram', patientId] });
    queryClient.invalidateQueries({ queryKey: ['patient-tooth-history', patientId] });
  };

  useEffect(() => {
    const params = new URLSearchParams();
    if (selection?.tooth) params.set('tooth', String(selection.tooth));
    if (asOfDate) params.set('asof', asOfDate);
    window.history.replaceState(null, '', `${window.location.pathname}${params.size ? `?${params}` : ''}`);
  }, [selection, asOfDate]);

  // Keyboard shortcuts (spec §47): arrows walk the arch, Escape clears,
  // Ctrl+Z / Ctrl+Shift+Z undo/redo the last charted finding.
  useEffect(() => {
    const onKeyDown = async (event: KeyboardEvent) => {
      if ((event.target as HTMLElement)?.tagName === 'INPUT' || (event.target as HTMLElement)?.tagName === 'SELECT' || (event.target as HTMLElement)?.tagName === 'TEXTAREA') return;

      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'z') {
        event.preventDefault();
        if (!canChart) return;
        if (event.shiftKey) {
          const next = redoStack.current.pop();
          if (!next) return;
          try {
            const created = await addToothCondition(next.payload);
            undoStack.current.push({ conditionId: created.id, payload: next.payload });
            toast.success('Finding restored');
            refreshChart();
          } catch {
            toast.error('Could not restore the finding');
          }
        } else {
          const last = undoStack.current.pop();
          if (!last) return;
          try {
            await deleteToothCondition(last.conditionId);
            redoStack.current.push(last);
            toast.success('Finding undone');
            refreshChart();
          } catch {
            toast.error('Could not undo the finding');
          }
        }
        return;
      }

      if (event.key === 'Escape') {
        setSelection(null);
        return;
      }

      const FDI_ORDER = [...MAXILLA_FDI, ...MANDIBLE_FDI];
      const step = (direction: number) => {
        setSelection((current: OdontogramSelection | null) => {
          const idx = current?.tooth ? FDI_ORDER.indexOf(current.tooth) : (direction > 0 ? -1 : FDI_ORDER.length);
          const nextIdx = Math.min(FDI_ORDER.length - 1, Math.max(0, idx + direction));
          return { tooth: FDI_ORDER[nextIdx], surface: null };
        });
      };

      if (event.key === 'ArrowRight') { event.preventDefault(); step(canChart ? -0 + 1 : 1); }
      else if (event.key === 'ArrowLeft') { event.preventDefault(); step(-1); }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canChart]);

  const odontogramQuery = useQuery({
    queryKey: ['clinical-odontogram', patientId, asOfDate],
    queryFn: async (): Promise<OdontogramPayload> =>
      asOfDate ? await getClinicalOdontogramAt(patientId, new Date(asOfDate).toISOString()) : await getClinicalOdontogram(patientId),
    enabled: Boolean(patientId),
  });

  const teeth = odontogramQuery.data?.teeth ?? {};
  const allFindings = useMemo(() => Object.values(teeth).flatMap((entry) => entry.findings), [teeth]);
  const chartFindings = useMemo(() => mapFindings(allFindings), [allFindings]);

  const selectedKey = selection?.tooth ? String(selection.tooth) : '';
  const toothHistoryQuery = useQuery({
    queryKey: ['patient-tooth-history', patientId, selectedKey],
    queryFn: () => getToothHistory(patientId, selectedKey),
    enabled: Boolean(selectedKey),
  });

  const historyEvents: ClinicalTimelineEventVM[] = toothHistoryQuery.data?.events ?? [];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <Link to={tenantPath(patientId, `patients/${patientId}`)} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-3.5 w-3.5" /> Back to patient
          </Link>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight">Clinical workspace</h1>
          <p className="text-muted-foreground">Odontogram, findings and per-tooth history</p>
        </div>
        <div className="flex items-end gap-2">
          <div className="space-y-1">
            <Label htmlFor="asof-date" className="text-xs text-muted-foreground">View state at date (optional)</Label>
            <Input
              id="asof-date"
              type="date"
              value={asOfDate}
              max={new Date().toISOString().slice(0, 10)}
              onChange={(event) => setAsOfDate(event.target.value)}
              className="w-44"
            />
          </div>
          {asOfDate && (
            <Button variant="ghost" onClick={() => setAsOfDate('')}>
              <RefreshCw className="h-4 w-4" /> Current
            </Button>
          )}
          {canChart && !asOfDate && (
            <Button onClick={() => setAddOpen(true)} disabled={!selectedKey}>
              Add finding{selectedKey ? ` — ${selectedKey}` : ''}
            </Button>
          )}
        </div>
      </div>

      {asOfDate && (
        <p role="status" className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-200">
          Showing the reconstructed odontogram as it existed on {new Date(asOfDate).toLocaleDateString('en-AU')}.
        </p>
      )}

      {odontogramQuery.isLoading ? (
        <Skeleton className="h-72 w-full" />
      ) : odontogramQuery.isError ? (
        <p className="rounded-md border border-destructive/40 bg-destructive/10 p-4 text-sm">
          The odontogram could not be loaded. You may not have access to dental charts for this practice.
        </p>
      ) : (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">{asOfDate ? 'Historical odontogram' : 'Current odontogram'} <span className="ml-2 text-xs font-normal text-muted-foreground">(FDI)</span></CardTitle>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            <Odontogram
              conditions={chartFindings as never}
              numbering="universal"
              selected={selection}
              onSelect={setSelection}
            />
            <p className="sr-only" aria-live="polite">
              {selection?.tooth ? `Tooth ${selection.tooth} selected` : 'No tooth selected'}
            </p>
          </CardContent>
        </Card>
      )}

      {selectedKey && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Tooth {selectedKey} history</CardTitle>
          </CardHeader>
          <CardContent>
            {toothHistoryQuery.isLoading ? (
              <div className="space-y-2">{[0, 1].map((i) => <Skeleton key={i} className="h-8 w-full" />)}</div>
            ) : historyEvents.length === 0 ? (
              <p className="py-4 text-center text-sm text-muted-foreground">No findings or treatments recorded for this tooth.</p>
            ) : (
              <ol className="relative space-y-3 border-l pl-5">
                {historyEvents.map((event) => (
                  <li key={event.id} className="relative">
                    <span aria-hidden className="absolute -left-[26px] top-1.5 h-2 w-2 rounded-full bg-border" />
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant="outline">{event.type.replaceAll('_', ' ')}</Badge>
                      <span className="text-xs text-muted-foreground">{new Date(event.occurredAt).toLocaleDateString('en-AU')}</span>
                    </div>
                    <p className="text-sm">{event.title}</p>
                  </li>
                ))}
              </ol>
            )}
          </CardContent>
        </Card>
      )}

      {!canChart && (
        <p className="text-xs text-muted-foreground">You have view-only access to clinical charting.</p>
      )}

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Radiation className="h-4 w-4" />
            Acquisition
          </CardTitle>
        </CardHeader>
        <CardContent>
          <PatientImagingGallery patientId={patientId} patientName="" />
          <Button variant="outline" size="sm" className="mt-4 gap-1.5" onClick={() => setCameraOpen(true)}>
            <Camera className="h-4 w-4" />
            Capture image
          </Button>
        </CardContent>
      </Card>

      {addOpen && selection?.tooth && (
        <AddFindingDialog
          patientId={patientId}
          tooth={selection.tooth}
          surface={selection.surface}
          open={addOpen}
          onOpenChange={setAddOpen}
        />
      )}

      <CameraCaptureDialog open={cameraOpen} onOpenChange={setCameraOpen} presetPatientId={patientId} />
    </div>
  );
}
