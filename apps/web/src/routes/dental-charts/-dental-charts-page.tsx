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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@danta/ui/table';
import { ToggleGroup, ToggleGroupItem } from '@danta/ui/toggle-group';
import {
  SURFACE_LABELS,
  universalToFdi,
  fdiToUniversal,
  type ClinicalStatus,
  type ToothConditionStatus,
  type ToothSurface,
  type FindingSeverity,
} from '@danta/schemas';
import { apiGet } from '../../lib/api/request';
import {
  addToothCondition,
  createDentalChart,
  deleteToothCondition,
  generatePlanFromChart,
  getDentalCharts,
  getToothConditions,
  type ChartPlanLine,
} from '../../lib/api/dental-charts';
import { getTenantSchedulingResources } from '../../lib/api/clinical-modules';
import { getToothConditionConfigs } from '../../lib/api/tooth-condition-configs';
import { Odontogram } from '../../components/clinical/Odontogram';
import { ToothModal } from '../../components/clinical/ToothModal';
import { ModuleSelectorModal } from '../../components/clinical/ModuleSelectorModal';
import { TreatmentPalette } from '../../components/clinical/TreatmentPalette';
import { HistoryChips } from '../../components/clinical/HistoryChips';
import { ChartSessionProvider, useChartSession } from '../../lib/clinical/chart-session';
import type { ClinicalModule, DentalChart, Patient, Provider, ToothCondition, ToothConditionConfig } from '@danta/schemas';
import { formatCurrency } from '../../lib/format';
import { tenantPath } from '../../lib/tenant-routing';
import { useAuth } from '../../lib/auth-context';
import { toast } from 'sonner';

const POLL_INTERVAL_5MIN = 5 * 60 * 1000;

function DentalChartsInner() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { dentition, setDentition } = useChartSession();
  const [patientSearch, setPatientSearch] = useState('');
  const [patientId, setPatientId] = useState<string | null>(null);
  const [numbering, setNumbering] = useState<'universal' | 'fdi'>('fdi');
  const [planDialogOpen, setPlanDialogOpen] = useState(false);
  const [generatedPlan, setGeneratedPlan] = useState<{ items: ChartPlanLine[]; estimatedTotal: number; planId: string } | null>(null);
  const [providerId, setProviderId] = useState('');
  const [saving, setSaving] = useState(false);
  const [selectedModule, setSelectedModule] = useState<ClinicalModule | null>(null);
  const [moduleModalOpen, setModuleModalOpen] = useState(false);
  const [toothModal, setToothModal] = useState<{ tooth: string; isMaxilla: boolean } | null>(null);

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
    queryKey: ['scheduling-resources', 'odontogram'],
    queryFn: getTenantSchedulingResources,
    enabled: !!patientId,
  });

  const moduleTabs = useMemo(() => {
    const resource = resourcesQuery.data?.[0];
    if (!resource) return [];
    return (resource.modules ?? [])
      .filter((m) => m.active)
      .sort((a, b) => a.order - b.order)
      .map((m) => ({ type: m.clinicalModule.type, displayName: m.clinicalModule.displayName }));
  }, [resourcesQuery.data]);

  const activeModules = useMemo(() => {
    const resource = resourcesQuery.data?.[0];
    if (!resource) return [];
    return (resource.modules ?? [])
      .filter((m) => m.active)
      .sort((a, b) => a.order - b.order)
      .map((m) => m.clinicalModule);
  }, [resourcesQuery.data]);

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

  const handleToothClick = async (tooth: string, isMaxilla: boolean) => {
    if (!chart) {
      try { await ensureChart(); await queryClient.invalidateQueries({ queryKey: ['dental-charts', patientId] }); }
      catch { toast.error('Failed to create dental chart'); return; }
    }
    if (activeModules.length > 0 && !selectedModule) {
      setToothModal({ tooth, isMaxilla });
      setModuleModalOpen(true);
      return;
    }
    setToothModal({ tooth, isMaxilla });
  };

  const handleModuleChosen = (module: ClinicalModule) => {
    setSelectedModule(module);
    setModuleModalOpen(false);
  };

  const handleModalSubmit = async (form: {
    conditionCode: string;
    surfaces: ToothSurface[];
    status: ToothConditionStatus;
    clinicalStatus: ClinicalStatus;
    severity?: FindingSeverity;
    notes?: string;
  }) => {
    if (!chart || !toothModal) return;
    setSaving(true);
    try {
      const created = await addToothCondition({
        dentalChartId: chart.id,
        toothNumber: toothModal.tooth,
        condition: form.conditionCode,
        scope: 'tooth',
        dentition,
        surfaces: form.surfaces,
        status: form.status,
        ...(form.clinicalStatus ? { clinicalStatus: form.clinicalStatus } : {}),
        ...(selectedModule?.type ? { clinicalModule: selectedModule.type } : {}),
        ...(form.severity ? { severity: form.severity } : {}),
        ...(form.notes?.trim() ? { notes: form.notes.trim() } : {}),
      });
      queryClient.setQueryData<ToothCondition[]>(['tooth-conditions', chart.id], (prev) => [...(prev ?? []), created]);
      const cfg = conditionConfigs.find((c) => c.code === form.conditionCode);
      toast.success(`Recorded ${cfg?.name ?? form.conditionCode} on tooth ${toothModal.tooth}`);
      setToothModal(null);
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
    } catch (error) {
      const message = error instanceof Error && error.message.includes('No charted conditions')
        ? 'No charted conditions map to planned treatment yet'
        : 'Failed to generate treatment plan';
      toast.error(message);
    } finally { setSaving(false); }
  };

  const selectedToothConditions = toothModal
    ? conditions
        .filter((c) => c.toothNumber === toothModal.tooth || c.toothNumber === String(Number(toothModal.tooth)))
        .map((c) => ({
          id: c.id,
          toothNumber: c.toothNumber ?? '',
          condition: c.condition,
          surfaces: c.surfaces ?? [],
          surface: c.surface,
          status: c.status,
        }))
    : [];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Tooth Charting</h1>
          <p className="text-muted-foreground">Interactive odontogram — click a tooth to record findings</p>
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
            <Button variant="ghost" size="sm" onClick={() => { setPatientId(null); setToothModal(null); }}>&larr; Change patient</Button>
            {chart && <Badge variant="secondary">Chart {chart.id.slice(0, 8)} &middot; {new Date(chart.chartDate).toLocaleDateString()}</Badge>}
          </div>

          <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
            <div className="space-y-4 min-w-0">
              <Card>
                <CardContent className="pt-6">
                  {chartsQuery.isLoading ? <Skeleton className="h-96 w-full" /> : (
                    <Odontogram
                      conditions={conditions}
                      numbering={numbering}
                      onSelect={() => {}}
                      onToothClick={handleToothClick}
                      dentition={dentition}
                      moduleTabs={moduleTabs}
                      activeModuleType={selectedModule?.type ?? null}
                      onModuleChange={(type) => {
                        const mod = type ? activeModules.find((m) => m.type === type) ?? null : null;
                        setSelectedModule(mod);
                      }}
                      conditionConfigMap={conditionConfigMap}
                    />
                  )}
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2"><CardTitle className="text-base">Charted conditions ({conditions.length})</CardTitle></CardHeader>
                <CardContent>
                  {conditions.length === 0 ? (
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
                        {conditions.map((condition) => {
                          const cfg = conditionConfigs.find((c) => c.code === condition.condition);
                          const color = cfg?.color ?? '#64748b';
                          const label = cfg?.name ?? condition.condition;
                          return (
                            <TableRow key={condition.id}>
                              <TableCell className="font-medium">{condition.toothNumber}<span className="ml-1.5 text-xs text-muted-foreground">({numbering === 'fdi' ? `Univ ${fdiToUniversal(Number(condition.toothNumber))}` : `FDI ${universalToFdi(Number(condition.toothNumber))}`})</span></TableCell>
                              <TableCell><span className="inline-flex items-center gap-1.5"><span className="inline-block h-2.5 w-2.5 rounded-full" style={{ backgroundColor: color }} />{label}</span></TableCell>
                              <TableCell>{(condition.surfaces?.length ? condition.surfaces.map((s) => SURFACE_LABELS[s as ToothSurface] ?? s).join('+') : (condition.surface ? SURFACE_LABELS[condition.surface as ToothSurface] ?? condition.surface : '—'))}</TableCell>
                              <TableCell><Badge variant={condition.status === 'planned' ? 'default' : condition.status === 'watch' ? 'secondary' : 'outline'}>{condition.status}</Badge></TableCell>
                              <TableCell>{cfg?.cdtCode ? <span className="font-mono text-xs">{cfg.cdtCode}{cfg.cdtFee ? ` · ${formatCurrency(cfg.cdtFee)}` : ''}</span> : '—'}</TableCell>
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
        </>
      )}

      {toothModal && (
        <ToothModal
          open={!!toothModal}
          onOpenChange={(open) => !open && setToothModal(null)}
          tooth={toothModal.tooth}
          isMaxilla={toothModal.isMaxilla}
          conditions={selectedToothConditions}
          conditionConfigs={conditionConfigs}
          moduleType={selectedModule?.type ?? null}
          saving={saving}
          onSubmit={handleModalSubmit}
          onDeleteCondition={handleDeleteCondition}
        />
      )}

      <ModuleSelectorModal
        open={moduleModalOpen}
        tooth={toothModal?.tooth ?? ''}
        modules={activeModules}
        onSelect={handleModuleChosen}
        onOpenChange={setModuleModalOpen}
      />

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
      <DentalChartsInner />
    </ChartSessionProvider>
  );
}
