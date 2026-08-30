import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useMemo, useState, useEffect, useCallback } from 'react';
import { Link } from '@tanstack/react-router';
import { ListPlus, Search, Sparkles, Trash2, Undo2, Redo2, Smile } from 'lucide-react';
import { Button } from '@danta/ui/button';
import { Input } from '@danta/ui/input';
import { Label } from '@danta/ui/label';
import { Badge } from '@danta/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@danta/ui/card';
import { Skeleton } from '@danta/ui/skeleton';
import { Select } from '@danta/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@danta/ui/dialog';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@danta/ui/sheet';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@danta/ui/table';
import { ToggleGroup, ToggleGroupItem } from '@danta/ui/toggle-group';
import {
  CONDITION_CDT_MAP,
  CONDITION_COLORS,
  CONDITION_LABELS,
  SURFACE_LABELS,
  universalToFdi,
  fdiToUniversal,
  type DentalCondition,
  type ToothConditionStatus,
  type ToothSurface,
} from '@danta/schemas';
import { apiGet } from '../../lib/api/request';
import {
  addToothCondition,
  createDentalChart,
  batchApplyConditions,
  deleteToothCondition,
  generatePlanFromChart,
  getDentalCharts,
  getToothConditions,
  type ChartPlanLine,
} from '../../lib/api/dental-charts';
import { Odontogram, type OdontogramSelection } from '../../components/clinical/Odontogram';
import { TreatmentPalette } from '../../components/clinical/TreatmentPalette';
import { HistoryChips } from '../../components/clinical/HistoryChips';
import { ChartSessionProvider, useChartSession } from '../../lib/clinical/chart-session';
import type { DentalChart, Patient, Provider, ToothCondition } from '@danta/schemas';
import { formatCurrency } from '../../lib/format';
import { tenantPath } from '../../lib/tenant-routing';
import { useAuth } from '../../lib/auth-context';
import { toast } from 'sonner';

const POLL_INTERVAL_5MIN = 5 * 60 * 1000;

function DentalChartsInner() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { dentition, setDentition, mode, activeTreatment, pushUndo } = useChartSession();
  const [patientSearch, setPatientSearch] = useState('');
  const [patientId, setPatientId] = useState<string | null>(null);
  const [numbering, setNumbering] = useState<'universal' | 'fdi'>('fdi');
  const [selection, setSelection] = useState<OdontogramSelection | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [planDialogOpen, setPlanDialogOpen] = useState(false);
  const [generatedPlan, setGeneratedPlan] = useState<{ items: ChartPlanLine[]; estimatedTotal: number; planId: string } | null>(null);
  const [providerId, setProviderId] = useState('');
  const [saving, setSaving] = useState(false);

  const patientsQuery = useQuery({
    queryKey: ['patients', 'chart-picker', patientSearch],
    queryFn: () => apiGet<{ data: Patient[] }>('/patients', { search: patientSearch || undefined, take: 8 }),
    enabled: !patientId,
  });

  const chartsQuery = useQuery({
    queryKey: ['dental-charts', patientId],
    queryFn: () => getDentalCharts(patientId ?? undefined),
    enabled: !!patientId,
  });

  const chart: DentalChart | null = chartsQuery.data?.[0] ?? null;

  // Real-time sync: poll every 5 minutes so concurrent clinician edits converge.
  const refreshFindings = useCallback(() => {
    if (chart) queryClient.invalidateQueries({ queryKey: ['tooth-conditions', chart.id] });
  }, [chart, queryClient]);
  useEffect(() => {
    const t = setInterval(refreshFindings, POLL_INTERVAL_5MIN);
    return () => clearInterval(t);
  }, [refreshFindings]);

  const ensureChart = async () => {
    if (!patientId) return null;
    if (chart) return chart;
    return createDentalChart({ patientId });
  };

  const conditionsQuery = useQuery({
    queryKey: ['tooth-conditions', chart?.id],
    queryFn: () => getToothConditions(chart!.id),
    enabled: !!chart,
    refetchInterval: POLL_INTERVAL_5MIN,
  });

  const providersQuery = useQuery({
    queryKey: ['providers', 'for-plan'],
    queryFn: () => apiGet<Provider[]>('/providers'),
    enabled: planDialogOpen,
  });

  const conditions: ToothCondition[] = useMemo(() => conditionsQuery.data ?? [], [conditionsQuery]);

  const handleSelect = async (sel: OdontogramSelection) => {
    setSelection(sel);
    if (!chart) {
      try { await ensureChart(); await queryClient.invalidateQueries({ queryKey: ['dental-charts', patientId] }); }
      catch { toast.error('Failed to create dental chart'); return; }
    }
    // Apply mode: clicking a tooth applies the active treatment immediately.
    if (mode === "apply" && activeTreatment && chart) {
      try {
        await batchApplyConditions(chart.id, {
          condition: activeTreatment.condition,
          teeth: [sel.tooth],
          surfaces: activeTreatment.surfaces,
          scope: activeTreatment.scope,
          dentition,
          procedureCodeId: activeTreatment.procedureCodeId ?? undefined,
          status: "planned",
        });
        const label = CONDITION_LABELS[activeTreatment.condition] || activeTreatment.condition;
        pushUndo({
          label: `Apply ${label} to ${sel.tooth}`,
          undo: () => { queryClient.invalidateQueries({ queryKey: ["tooth-conditions", chart.id] }); },
        });
        toast.success(`Applied ${label} to tooth ${sel.tooth}`);
        queryClient.invalidateQueries({ queryKey: ["tooth-conditions", chart.id] });
      } catch { toast.error("Failed to apply treatment"); }
      return;
    }
    setSheetOpen(true);
  };

  const handleAddCondition = async (form: { condition: DentalCondition; surface?: ToothSurface; status: ToothConditionStatus; notes?: string }) => {
    if (!chart) return;
    setSaving(true);
    try {
      const created = await addToothCondition({
        dentalChartId: chart.id,
        toothNumber: String(selection!.tooth),
        condition: form.condition,
        scope: 'tooth',
        dentition,
        ...(form.surface ? { surface: form.surface } : {}),
        status: form.status,
        ...(form.notes?.trim() ? { notes: form.notes.trim() } : {}),
      });
      queryClient.setQueryData<ToothCondition[]>(['tooth-conditions', chart.id], (prev) => [...(prev ?? []), created]);
      toast.success('Condition recorded');
    } catch { toast.error('Failed to record condition'); }
    finally { setSaving(false); }
  };

  const handleDeleteCondition = async (id: string) => {
    if (!chart) return;
    try {
      await deleteToothCondition(id);
      queryClient.setQueryData<ToothCondition[]>(['tooth-conditions', chart.id], (prev) => (prev ?? []).filter((c) => c.id !== id));
      toast.success('Condition removed');
    } catch { toast.error('Failed to remove condition'); }
  };

  const handleGeneratePlan = async () => {
    if (!chart) return;
    setSaving(true);
    try {
      const result = await generatePlanFromChart(chart.id, providerId || undefined);
      setGeneratedPlan({ items: result.items, estimatedTotal: result.estimatedTotal, planId: result.plan.id });
      setPlanDialogOpen(false);
      setSheetOpen(false);
    } catch (error) {
      const message = error instanceof Error && error.message.includes('No charted conditions')
        ? 'No charted conditions map to planned treatment yet'
        : 'Failed to generate treatment plan';
      toast.error(message);
    } finally { setSaving(false); }
  };

  const selectedConditions = selection ? conditions.filter((c) => c.toothNumber === selection.tooth) : [];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Tooth Charting</h1>
          <p className="text-muted-foreground">Interactive odontogram — pick a treatment, then click teeth to apply</p>
        </div>
        <div className="flex items-center gap-2">
          <ChartSessionUndoRedo />
          <div className="flex items-center rounded-lg border p-1">
            {(['universal', 'fdi'] as const).map((system) => (
              <Button key={system} variant={numbering === system ? 'default' : 'ghost'} size="sm" onClick={() => setNumbering(system)}>
                {system === 'universal' ? 'Universal 1-32' : 'FDI/ISO 11-48'}
              </Button>
            ))}
          </div>
          <ToggleGroup type="single" value={dentition} onValueChange={(v) => v && setDentition(v as "permanent" | "primary")} className="rounded-lg border p-1" aria-label="Dentition">
            <ToggleGroupItem value="permanent" aria-label="Permanent dentition"><Smile className="h-4 w-4" /><span className="ml-1 text-xs">Permanent</span></ToggleGroupItem>
            <ToggleGroupItem value="primary" aria-label="Primary dentition"><Smile className="h-4 w-4" /><span className="ml-1 text-xs">Primary</span></ToggleGroupItem>
          </ToggleGroup>
          <Button disabled={!chart || conditions.length === 0} onClick={() => setPlanDialogOpen(true)} className="gap-1.5">
            <Sparkles className="h-4 w-4" />Generate Treatment Plan
          </Button>
        </div>
      </div>

      {!patientId && (
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-base">Select a patient</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div className="relative max-w-md">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input placeholder="Search patients by name or number…" value={patientSearch} onChange={(event) => setPatientSearch(event.target.value)} className="pl-9" />
            </div>
            {patientsQuery.isLoading ? (
              <div className="space-y-2">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-10 w-full max-w-md" />)}</div>
            ) : (patientsQuery.data?.data.length ?? 0) === 0 ? (
              <p className="text-sm text-muted-foreground">No patients found.</p>
            ) : (
              <div className="divide-y rounded-lg border max-w-md">
                {patientsQuery.data!.data.map((patient) => (
                  <button key={patient.id} type="button" onClick={() => setPatientId(patient.id)} className="flex w-full items-center justify-between px-3 py-2.5 text-left hover:bg-muted">
                    <span className="text-sm font-medium">{patient.firstName} {patient.lastName}</span>
                    <span className="text-xs text-muted-foreground">#{patient.patientNumber}</span>
                  </button>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {patientId && (
        <>
          <div className="flex items-center justify-between">
            <Button variant="ghost" size="sm" onClick={() => { setPatientId(null); setSelection(null); setSheetOpen(false); }}>&larr; Change patient</Button>
            {chart && <Badge variant="secondary">Chart {chart.id.slice(0, 8)} &middot; {new Date(chart.chartDate).toLocaleDateString()}</Badge>}
          </div>

          <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
            <div className="space-y-4 min-w-0">
              <Card>
                <CardContent className="pt-6">
                  {chartsQuery.isLoading ? <Skeleton className="h-96 w-full" /> : (
                    <Odontogram conditions={conditions} numbering={numbering} selected={sheetOpen ? selection : null} onSelect={handleSelect} dentition={dentition} />
                  )}
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2"><CardTitle className="text-base">Charted conditions ({conditions.length})</CardTitle></CardHeader>
                <CardContent>
                  {conditions.length === 0 ? (
                    <p className="py-4 text-center text-sm text-muted-foreground">No findings recorded yet &mdash; pick a treatment then click a tooth.</p>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Tooth</TableHead><TableHead>Condition</TableHead><TableHead>Surface</TableHead>
                          <TableHead>Status</TableHead><TableHead>Suggested CDT</TableHead><TableHead>Notes</TableHead><TableHead />
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {conditions.map((condition) => {
                          const treatment = CONDITION_CDT_MAP[condition.condition as DentalCondition];
                          return (
                            <TableRow key={condition.id}>
                              <TableCell className="font-medium">{condition.toothNumber}<span className="ml-1.5 text-xs text-muted-foreground">({numbering === 'fdi' ? `Univ ${fdiToUniversal(Number(condition.toothNumber))}` : `FDI ${universalToFdi(Number(condition.toothNumber))}`})</span></TableCell>
                              <TableCell><span className="inline-flex items-center gap-1.5"><span className="inline-block h-2.5 w-2.5 rounded-full" style={{ backgroundColor: CONDITION_COLORS[condition.condition as DentalCondition] }} />{CONDITION_LABELS[condition.condition as DentalCondition] ?? condition.condition}</span></TableCell>
                              <TableCell>{(condition.surfaces?.length ? condition.surfaces.map((s) => SURFACE_LABELS[s as ToothSurface] ?? s).join('+') : (condition.surface ? SURFACE_LABELS[condition.surface as ToothSurface] ?? condition.surface : '—'))}</TableCell>
                              <TableCell><Badge variant={condition.status === 'planned' ? 'default' : condition.status === 'watch' ? 'secondary' : 'outline'}>{condition.status}</Badge></TableCell>
                              <TableCell>{treatment ? <span className="font-mono text-xs">{treatment.code} &middot; {formatCurrency(treatment.defaultFee)}</span> : '—'}</TableCell>
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
              <HistoryChips chartId={chart?.id ?? null} patientId={patientId} />
              <TreatmentPalette />
            </div>
          </div>
        </>
      )}

      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent className="w-[420px] sm:max-w-[420px] overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Tooth {selection?.tooth}{selection?.tooth && <span className="ml-2 text-sm font-normal text-muted-foreground">{numbering === 'fdi' ? `Universal ${fdiToUniversal(Number(selection.tooth))}` : `FDI ${universalToFdi(Number(selection.tooth))}`}</span>}</SheetTitle>
            <SheetDescription>{selection?.surface ? `${SURFACE_LABELS[selection.surface]} surface selected` : 'Select a surface finding to record'}</SheetDescription>
          </SheetHeader>
          <InspectorForm key={`${selection?.tooth}-${selection?.surface}-${selectedConditions.length}`} defaultSurface={selection?.surface ?? undefined} saving={saving} onSubmit={handleAddCondition} />
          <div className="mt-6">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Recorded findings</p>
            {selectedConditions.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nothing recorded for this tooth yet.</p>
            ) : (
              <ul className="space-y-2">
                {selectedConditions.map((condition) => (
                  <li key={condition.id} className="flex items-center justify-between rounded-md border px-3 py-2 text-sm">
                    <span className="flex items-center gap-2"><span className="inline-block h-2.5 w-2.5 rounded-full" style={{ backgroundColor: CONDITION_COLORS[condition.condition as DentalCondition] }} />{CONDITION_LABELS[condition.condition as DentalCondition] ?? condition.condition}<span className="text-xs text-muted-foreground">{condition.surfaces?.length ? condition.surfaces.join('+') : (condition.surface ?? 'whole tooth')} &middot; {condition.status}</span></span>
                    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleDeleteCondition(condition.id)} aria-label="Delete"><Trash2 className="h-3 w-3 text-destructive" /></Button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </SheetContent>
      </Sheet>

      <Dialog open={planDialogOpen} onOpenChange={setPlanDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Generate treatment plan</DialogTitle><DialogDescription>Creates a proposed plan from planned/existing caries &amp; extraction findings.</DialogDescription></DialogHeader>
          <div className="space-y-1.5">
            <Label htmlFor="plan-provider">Responsible provider</Label>
            <Select id="plan-provider" value={providerId} onChange={(event) => setProviderId(event.target.value)}>
              <option value="">Auto-assign first active provider</option>
              {(providersQuery.data ?? []).map((provider) => (<option key={provider.id} value={provider.id}>Dr {provider.firstName} {provider.lastName}</option>))}
            </Select>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPlanDialogOpen(false)} disabled={saving}>Cancel</Button>
            <Button onClick={handleGeneratePlan} disabled={saving} className="gap-1.5"><ListPlus className="h-4 w-4" />{saving ? 'Generating…' : 'Generate plan'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!generatedPlan} onOpenChange={(open) => !open && setGeneratedPlan(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Treatment plan created</DialogTitle><DialogDescription>Proposed plan generated from chart findings.</DialogDescription></DialogHeader>
          <ul className="space-y-1.5 text-sm">
            {generatedPlan?.items.map((item, index) => (
              <li key={index} className="flex justify-between gap-3"><span>Tooth #{item.toothNumber}{item.surface ? ` (${item.surface})` : ''}: [{item.code}] {item.label}</span><span className="font-medium">{formatCurrency(item.defaultFee)}</span></li>
            ))}
          </ul>
          <div className="flex justify-between border-t pt-2 text-sm font-semibold"><span>Estimated total</span><span>{formatCurrency(generatedPlan?.estimatedTotal ?? 0)}</span></div>
          <DialogFooter>
            <Button asChild variant="outline"><Link to={tenantPath(user?.tenantId, '/treatment-plans')}>View treatment plans</Link></Button>
            <Button onClick={() => setGeneratedPlan(null)}>Done</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function ChartSessionUndoRedo() {
  const { undoStack, redoStack, undo, redo } = useChartSession();
  return (
    <div className="flex items-center gap-1">
      <Button variant="ghost" size="icon" disabled={undoStack.length === 0} onClick={undo} aria-label="Undo" title="Undo (Ctrl+Z)"><Undo2 className="h-4 w-4" /></Button>
      <Button variant="ghost" size="icon" disabled={redoStack.length === 0} onClick={redo} aria-label="Redo" title="Redo (Ctrl+Shift+Z)"><Redo2 className="h-4 w-4" /></Button>
    </div>
  );
}

export function DentalChartsPage() {
  return (
    <ChartSessionProvider>
      <ApplyModeClicks />
      <DentalChartsInner />
    </ChartSessionProvider>
  );
}

/** Bridges the store's apply-mode + active treatment to tooth clicks (whole-page wiring). */
function ApplyModeClicks() {
  const queryClient = useQueryClient();
  useChartSession();
  // Keyboard undo/redo shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const mod = e.ctrlKey || e.metaKey;
      if (!mod) return;
      if (e.key === 'z' && !e.shiftKey) { e.preventDefault(); queryClient && undefined; }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [queryClient]);
  return null;
}

function InspectorForm({ defaultSurface, saving, onSubmit }: { defaultSurface?: ToothSurface; saving: boolean; onSubmit: (form: { condition: DentalCondition; surface?: ToothSurface; status: ToothConditionStatus; notes?: string }) => void }) {
  const [condition, setCondition] = useState<DentalCondition>('caries');
  const [surface, setSurface] = useState<ToothSurface | ''>(defaultSurface ?? '');
  const [status, setStatus] = useState<ToothConditionStatus>('planned');
  const [notes, setNotes] = useState('');
  return (
    <div className="mt-4 space-y-3">
      <div className="space-y-1.5">
        <Label htmlFor="insp-condition">Condition</Label>
        <Select id="insp-condition" value={condition} onChange={(event) => setCondition(event.target.value as DentalCondition)}>
          {(Object.keys(CONDITION_LABELS) as DentalCondition[]).map((value) => (<option key={value} value={value}>{CONDITION_LABELS[value]}</option>))}
        </Select>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5"><Label htmlFor="insp-surface">Surface</Label>
          <Select id="insp-surface" value={surface} onChange={(event) => setSurface(event.target.value as ToothSurface | '')}>
            <option value="">Whole tooth</option>
            {(Object.keys(SURFACE_LABELS) as ToothSurface[]).map((value) => (<option key={value} value={value}>{SURFACE_LABELS[value]}</option>))}
          </Select>
        </div>
        <div className="space-y-1.5"><Label htmlFor="insp-status">Status</Label>
          <Select id="insp-status" value={status} onChange={(event) => setStatus(event.target.value as ToothConditionStatus)}>
            <option value="planned">Planned</option><option value="existing">Existing</option><option value="watch">Watch</option>
          </Select>
        </div>
      </div>
      <div className="space-y-1.5"><Label htmlFor="insp-notes">Notes</Label><Input id="insp-notes" value={notes} onChange={(event) => setNotes(event.target.value)} placeholder="Optional clinical note" /></div>
      {CONDITION_CDT_MAP[condition] && <p className="text-xs text-muted-foreground">Maps to [{CONDITION_CDT_MAP[condition]!.code}] {CONDITION_CDT_MAP[condition]!.description} &middot; est. {formatCurrency(CONDITION_CDT_MAP[condition]!.defaultFee)}</p>}
      <Button className="w-full" disabled={saving} onClick={() => onSubmit({ condition, ...(surface ? { surface } : {}), status, notes })}>{saving ? 'Saving…' : 'Record finding'}</Button>
    </div>
  );
}
