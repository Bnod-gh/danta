import { useEffect, useMemo, useRef, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Link, useParams } from '@tanstack/react-router';
import { ArrowLeft, RefreshCw, Radiation, Camera, Smile, Trash2, Undo2, Redo2 } from 'lucide-react';
import { Button } from '@danta/ui/button';
import { Badge } from '@danta/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@danta/ui/card';
import { Input } from '@danta/ui/input';
import { Label } from '@danta/ui/label';
import { Skeleton } from '@danta/ui/skeleton';
import { ScrollArea } from '@danta/ui/scroll-area';
import { ToggleGroup, ToggleGroupItem } from '@danta/ui/toggle-group';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@danta/ui/table';
import { Odontogram, type OdontogramSelection, type OdontogramModuleTab } from '../../../../components/clinical/Odontogram';
import { ToothModal } from '../../../../components/clinical/ToothModal';
import { TreatmentPalette } from '../../../../components/clinical/TreatmentPalette';
import { HistoryChips } from '../../../../components/clinical/HistoryChips';
import { PatientImagingGallery } from '../../../../components/imaging/PatientImagingGallery';
import { CameraCaptureDialog } from '../../../../components/imaging/CameraCaptureDialog';
import {
  MAXILLA_FDI,
  MANDIBLE_FDI,
  fdiToUniversal,
  SURFACE_LABELS,
} from '@danta/schemas';
import type { ToothSurface, FindingSeverity, ToothConditionStatus, ClinicalStatus, ToothConditionConfig, Dentition, ToothCondition } from '@danta/schemas';
import { tenantPath } from '../../../../lib/tenant-routing';
import { useAuth } from '../../../../lib/auth-context';
import { getDentalCharts, createDentalChart, addToothCondition, deleteToothCondition, getToothConditions } from '../../../../lib/api/dental-charts';
import { getToothConditionConfigs } from '../../../../lib/api/tooth-condition-configs';
import { getTenantSchedulingResources } from '../../../../lib/api/clinical-modules';
import {
  getClinicalOdontogram,
  getClinicalOdontogramAt,
  getToothHistory,
  type ClinicalTimelineEventVM,
} from '../../../../lib/api/patient-clinical';
import { formatCurrency } from '../../../../lib/format';
import { toast } from 'sonner';

interface ChartFindingVM {
  id: string;
  toothNumber: string;
  condition: string;
  surface: string | null;
  surfaces: string[];
  status: string;
  severity?: string | null;
}

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

const FDI_ORDER = [...MAXILLA_FDI, ...MANDIBLE_FDI];

interface OdontogramPayload {
  teeth: Record<string, { findings: unknown[]; treatments: unknown[] }>;
}

export function PatientClinicalPage({ patientId: patientIdProp }: { patientId?: string } = {}) {
  const params = useParams({ strict: false }) as { id?: string };
  const patientId = patientIdProp ?? params.id ?? '';
  const { permissions, user } = useAuth();
  const canChart = permissions.includes('dental_chart:update') || user?.role === 'superadmin';

  const [numbering, setNumbering] = useState<'universal' | 'fdi'>('fdi');
  const [dentition, setDentition] = useState<Dentition>('permanent');
  const initialParams = useMemo(() => new URLSearchParams(window.location.search), []);
  const [asOfDate, setAsOfDate] = useState(initialParams.get('asof') ?? '');
  const [selection, setSelection] = useState<OdontogramSelection | null>(
    initialParams.get('tooth') ? { tooth: (initialParams.get('tooth') ?? ''), surface: null } : null,
  );
  const [toothModal, setToothModal] = useState<{ tooth: string; isMaxilla: boolean } | null>(null);
  const [cameraOpen, setCameraOpen] = useState(false);

  const undoStack = useRef<Array<{ conditionId: string; payload: Parameters<typeof addToothCondition>[0] }>>([]);
  const redoStack = useRef<Array<{ conditionId: string; payload: Parameters<typeof addToothCondition>[0] }>>([]);
  const queryClient = useQueryClient();

  const conditionConfigsQuery = useQuery({
    queryKey: ['tooth-condition-configs'],
    queryFn: () => getToothConditionConfigs(),
  });
  const conditionConfigs: ToothConditionConfig[] = conditionConfigsQuery.data ?? [];
  const conditionConfigMap = useMemo(() => {
    return conditionConfigs.reduce((acc, cfg) => {
      acc[cfg.code] = cfg;
      return acc;
    }, {} as Record<string, ToothConditionConfig>);
  }, [conditionConfigs]);

  const resourcesQuery = useQuery({
    queryKey: ['scheduling-resources'],
    queryFn: () => getTenantSchedulingResources(),
  });
  const odontogramResource = (resourcesQuery.data ?? []).find((r) => r.type === 'odontogram') ?? null;
  const moduleTabs: OdontogramModuleTab[] = useMemo(
    () => (odontogramResource?.modules ?? [])
      .filter((m) => m.active)
      .map((m) => ({ type: m.clinicalModule.type, displayName: m.clinicalModule.displayName })),
    [odontogramResource],
  );
  const [activeModuleType, setActiveModuleType] = useState<string | null>(null);

  const chartsQuery = useQuery({
    queryKey: ['dental-charts', patientId],
    queryFn: () => getDentalCharts(patientId),
    enabled: !!patientId,
  });
  const chart = chartsQuery.data?.[0] ?? null;

  const refreshChart = () => {
    queryClient.invalidateQueries({ queryKey: ['clinical-odontogram', patientId] });
    queryClient.invalidateQueries({ queryKey: ['patient-tooth-history', patientId] });
    queryClient.invalidateQueries({ queryKey: ['dental-charts', patientId] });
    queryClient.invalidateQueries({ queryKey: ['tooth-conditions', chart?.id] });
  };

  useEffect(() => {
    const params = new URLSearchParams();
    if (selection?.tooth) params.set('tooth', String(selection.tooth));
    if (asOfDate) params.set('asof', asOfDate);
    window.history.replaceState(null, '', `${window.location.pathname}${params.size ? `?${params}` : ''}`);
  }, [selection, asOfDate]);

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

  const toothConditionsQuery = useQuery({
    queryKey: ['tooth-conditions', chart?.id],
    queryFn: () => getToothConditions(chart!.id),
    enabled: !!chart,
  });
  const toothConditions: ToothCondition[] = toothConditionsQuery.data ?? [];

  const selectedKey = selection?.tooth ? String(selection.tooth) : '';
  const toothHistoryQuery = useQuery({
    queryKey: ['patient-tooth-history', patientId, selectedKey],
    queryFn: () => getToothHistory(patientId, selectedKey),
    enabled: Boolean(selectedKey),
  });

  const historyEvents: ClinicalTimelineEventVM[] = toothHistoryQuery.data?.events ?? [];

  const handleToothClick = async (tooth: string, isMaxilla: boolean) => {
    setSelection({ tooth, surface: null });
    if (!asOfDate && canChart) {
      setToothModal({ tooth, isMaxilla });
    }
  };

  const handleModalSubmit = async (form: {
    conditionCode: string;
    surfaces: ToothSurface[];
    status: ToothConditionStatus;
    clinicalStatus: ClinicalStatus;
    severity?: FindingSeverity;
    notes?: string;
  }) => {
    if (!toothModal) return;
    try {
      const charts = await getDentalCharts(patientId);
      let chartId = charts?.[0]?.id;
      if (!chartId) {
        const created = await createDentalChart({ patientId });
        chartId = created.id;
      }
      const payload: Parameters<typeof addToothCondition>[0] = {
        dentalChartId: chartId,
        toothNumber: toothModal.tooth,
        condition: form.conditionCode,
        scope: 'tooth',
        dentition,
        surfaces: form.surfaces,
        status: form.status,
        ...(form.clinicalStatus ? { clinicalStatus: form.clinicalStatus } : {}),
        ...(activeModuleType ? { clinicalModule: activeModuleType } : {}),
        ...(form.severity ? { severity: form.severity } : {}),
        ...(form.notes?.trim() ? { notes: form.notes.trim() } : {}),
      };
      const created = await addToothCondition(payload);
      undoStack.current.push({ conditionId: created.id, payload });
      const cfg = conditionConfigs.find((c) => c.code === form.conditionCode);
      toast.success(`Recorded ${cfg?.name ?? form.conditionCode} on tooth ${toothModal.tooth}`);
      setToothModal(null);
      refreshChart();
    } catch (error) {
      toast.error(error instanceof Error && error.message ? error.message : 'Could not record the finding');
    }
  };

  const handleDeleteCondition = async (id: string) => {
    try {
      await deleteToothCondition(id);
      toast.success('Condition removed');
      refreshChart();
    } catch {
      toast.error('Could not remove the condition');
    }
  };

  const activeFindings = asOfDate ? chartFindings : toothConditions;

  const selectedToothConditions = toothModal
    ? activeFindings.filter((c) => c.toothNumber === toothModal.tooth || c.toothNumber === String(Number(toothModal.tooth)))
    : [];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <Link to={tenantPath(user?.tenantId, `patients/${patientId}`)} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-3.5 w-3.5" /> Back to patient
          </Link>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight">Clinical workspace</h1>
          <p className="text-muted-foreground">Interactive odontogram — click a tooth to record findings</p>
        </div>
        <div className="flex items-end gap-2">
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" disabled={undoStack.current.length === 0} onClick={() => {
              const last = undoStack.current.pop();
              if (!last) return;
              deleteToothCondition(last.conditionId).then(() => {
                toast.success('Finding undone');
                refreshChart();
              }).catch(() => {
                toast.error('Could not undo the finding');
                undoStack.current.push(last);
              });
            }} aria-label="Undo" title="Undo (Ctrl+Z)"><Undo2 className="h-4 w-4" /></Button>
            <Button variant="ghost" size="icon" disabled={redoStack.current.length === 0} onClick={() => {
              const next = redoStack.current.pop();
              if (!next) return;
              addToothCondition(next.payload).then((created) => {
                undoStack.current.push({ conditionId: created.id, payload: next.payload });
                toast.success('Finding restored');
                refreshChart();
              }).catch(() => {
                toast.error('Could not restore the finding');
                redoStack.current.push(next);
              });
            }} aria-label="Redo" title="Redo (Ctrl+Shift+Z)"><Redo2 className="h-4 w-4" /></Button>
          </div>
          <div className="flex items-center rounded-lg border p-1">
            {(['universal', 'fdi'] as const).map((system) => (
              <Button key={system} variant={numbering === system ? 'default' : 'ghost'} size="sm" onClick={() => setNumbering(system)}>
                {system === 'universal' ? 'Universal 1-32' : 'FDI/ISO 11-48'}
              </Button>
            ))}
          </div>
          <ToggleGroup type="single" value={dentition} onValueChange={(v) => v && setDentition(v as Dentition)} className="rounded-lg border p-1" aria-label="Dentition">
            <ToggleGroupItem value="permanent" aria-label="Permanent dentition"><Smile className="h-4 w-4" /><span className="ml-1 text-xs">Permanent</span></ToggleGroupItem>
            <ToggleGroupItem value="primary" aria-label="Primary dentition"><Smile className="h-4 w-4" /><span className="ml-1 text-xs">Primary</span></ToggleGroupItem>
          </ToggleGroup>
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
        </div>
      </div>

      {asOfDate && (
        <p role="status" className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-200">
          Showing the reconstructed odontogram as it existed on {new Date(asOfDate).toLocaleDateString('en-AU')}.
        </p>
      )}

      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <div className="space-y-4 min-w-0">
          {odontogramQuery.isLoading ? (
            <Skeleton className="h-72 w-full" />
          ) : odontogramQuery.isError ? (
            <p className="rounded-md border border-destructive/40 bg-destructive/10 p-4 text-sm">
              The odontogram could not be loaded. You may not have access to dental charts for this practice.
            </p>
          ) : (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">{asOfDate ? 'Historical odontogram' : 'Odontogram'} <span className="ml-2 text-xs font-normal text-muted-foreground">(FDI)</span></CardTitle>
              </CardHeader>
              <CardContent>
                <Odontogram
                  conditions={activeFindings as never}
                  numbering={numbering}
                  selected={selection}
                  onSelect={setSelection}
                  onToothClick={handleToothClick}
                  dentition={dentition}
                  moduleTabs={moduleTabs}
                  activeModuleType={activeModuleType}
                  onModuleChange={setActiveModuleType}
                  conditionConfigMap={conditionConfigMap}
                />
                {!canChart && <p className="mt-2 text-xs text-muted-foreground">You have view-only access to clinical charting.</p>}
                {canChart && !asOfDate && (
                  <p className="mt-2 text-xs text-muted-foreground">Click any tooth to open the charting modal.</p>
                )}
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
                  <ScrollArea className="h-64 pr-4">
                    <div className="relative space-y-4 border-l pl-5">
                      {historyEvents.map((event) => {
                        const moduleType = typeof event.metadata?.clinicalModule === 'string' ? event.metadata.clinicalModule : undefined;
                        const date = new Date(event.occurredAt).toLocaleDateString('en-AU');
                        return (
                          <div key={event.id} className="relative">
                            <span aria-hidden className="absolute -left-[26px] top-1.5 h-2.5 w-2.5 rounded-full bg-primary" />
                            <div className="flex flex-wrap items-center gap-2">
                              <Badge variant="outline" className="text-[10px]">{event.type.replaceAll('_', ' ')}</Badge>
                              {moduleType && (
                                <Badge variant="secondary" className="text-[10px]">{String(moduleType).replace('odontogram_', '')}</Badge>
                              )}
                            </div>
                            <p className="mt-1 text-sm font-medium">{event.title}</p>
                            <time className="text-xs text-muted-foreground">{date}</time>
                          </div>
                        );
                      })}
                    </div>
                  </ScrollArea>
                )}
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-base">Charted conditions ({toothConditions.length})</CardTitle></CardHeader>
            <CardContent>
              {toothConditions.length === 0 ? (
                <p className="py-4 text-center text-sm text-muted-foreground">No findings recorded yet — click a tooth to chart.</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Tooth</TableHead><TableHead>Condition</TableHead><TableHead>Surface</TableHead>
                      <TableHead>Status</TableHead><TableHead>Suggested CDT</TableHead><TableHead>Notes</TableHead><TableHead />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {toothConditions.map((condition) => {
                      const cfg = conditionConfigs.find((c) => c.code === condition.condition);
                      const color = cfg?.color ?? '#64748b';
                      const label = cfg?.name ?? condition.condition;
                      return (
                        <TableRow key={condition.id}>
                          <TableCell className="font-medium">{condition.toothNumber}<span className="ml-1.5 text-xs text-muted-foreground">({numbering === 'fdi' ? `Univ ${fdiToUniversal(Number(condition.toothNumber))}` : `FDI`})</span></TableCell>
                          <TableCell><span className="inline-flex items-center gap-1.5"><span className="inline-block h-2.5 w-2.5 rounded-full" style={{ backgroundColor: color }} />{label}</span></TableCell>
                          <TableCell>{(condition.surfaces?.length ? condition.surfaces.map((s) => SURFACE_LABELS[s as ToothSurface] ?? s).join('+') : (condition.surface ? SURFACE_LABELS[condition.surface as ToothSurface] ?? condition.surface : '—'))}</TableCell>
                          <TableCell><Badge variant={condition.status === 'planned' ? 'default' : condition.status === 'watch' ? 'secondary' : 'outline'}>{condition.status}</Badge></TableCell>
                          <TableCell>{cfg?.cdtCode ? <span className="font-mono text-xs">{cfg.cdtCode}{cfg.cdtFee != null ? ` · ${formatCurrency(cfg.cdtFee)}` : ''}</span> : '—'}</TableCell>
                          <TableCell className="max-w-40 truncate text-xs text-muted-foreground">{condition.notes ?? '—'}</TableCell>
                          <TableCell><Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleDeleteCondition(condition.id)} aria-label="Delete condition"><Trash2 className="h-3.5 w-3.5 text-destructive" /></Button></TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>

<div className="space-y-4">
            <HistoryChips chartId={chart?.id ?? null} patientId={patientId} conditionConfigs={conditionConfigs} />
              <TreatmentPalette />
         </div>
      </div>

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
          <div className="flex gap-2 mb-4">
            <Button variant="outline" size="sm" className="gap-1.5" onClick={() => setCameraOpen(true)}>
              <Camera className="h-4 w-4" />
              Capture image
            </Button>
            <Button variant="outline" size="sm" className="gap-1.5" onClick={() => setCameraOpen(true)}>
              <Radiation className="h-4 w-4" />
              Acquisition
            </Button>
          </div>
          <PatientImagingGallery patientId={patientId} patientName="" />
        </CardContent>
      </Card>

      {toothModal && (
        <ToothModal
          open={!!toothModal}
          onOpenChange={(open) => !open && setToothModal(null)}
          tooth={toothModal.tooth}
          isMaxilla={toothModal.isMaxilla}
          conditions={selectedToothConditions.map((c) => ({
            id: c.id,
            toothNumber: c.toothNumber ?? '',
            condition: c.condition,
            surfaces: c.surfaces,
            surface: c.surface,
            status: c.status,
          }))}
          conditionConfigs={conditionConfigs}
          moduleType={activeModuleType}
          onSubmit={handleModalSubmit}
          onDeleteCondition={handleDeleteCondition}
        />
      )}

      <CameraCaptureDialog open={cameraOpen} onOpenChange={setCameraOpen} presetPatientId={patientId} />
    </div>
  );
}
