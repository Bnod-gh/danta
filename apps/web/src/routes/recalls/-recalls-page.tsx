import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { Plus, Search, CheckCircle, Calendar, MoreHorizontal, RefreshCw, Timer } from 'lucide-react';
import { Button } from '@danta/ui/button';
import { Input } from '@danta/ui/input';
import { Label } from '@danta/ui/label';
import { Badge } from '@danta/ui/badge';
import { Skeleton } from '@danta/ui/skeleton';
import { cn } from '@danta/ui/utils';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@danta/ui/dialog';
import {
  Select,
} from '@danta/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@danta/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@danta/ui/dropdown-menu';
import { apiGet, apiPost, apiPut } from '../../lib/api/request';
import { getRecallConfigs, runRecallScan, updateRecallConfig, type RecallTypeConfig } from '../../lib/api/recalls';
import { toast } from 'sonner';
import type { Patient, Recall } from '@danta/schemas';

const STATUS_OPTIONS = [
  { value: '', label: 'All statuses' },
  { value: 'pending', label: 'Pending' },
  { value: 'due', label: 'Due' },
  { value: 'overdue', label: 'Overdue' },
  { value: 'booked', label: 'Booked' },
  { value: 'completed', label: 'Completed' },
  { value: 'failed', label: 'Failed' },
  { value: 'cancelled', label: 'Cancelled' },
];

const TYPE_OPTIONS = [
  { value: '', label: 'All types' },
  { value: 'hygiene', label: 'Hygiene recall (6-month prophy)' },
  { value: 'periodontal', label: 'Periodontal (3-month perio)' },
  { value: 'treatment_followup', label: 'Post-op follow-up' },
  { value: 'examination', label: 'Examination' },
  { value: 'xray', label: 'X-ray review' },
  { value: 'custom', label: 'Custom' },
];

function getStatusBadge(status: string) {
  const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
    due: 'default',
    overdue: 'destructive',
    pending: 'secondary',
    booked: 'outline',
    completed: 'default',
    failed: 'destructive',
    cancelled: 'outline',
  };
  return <Badge variant={variants[status] || 'outline'}>{status}</Badge>;
}

export function RecallsPage() {
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [type, setType] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [patientId, setPatientId] = useState('');
  const [recallType, setRecallType] = useState('hygiene');
  const [dueDate, setDueDate] = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const queryClient = useQueryClient();

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['recalls', search, status, type],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      if (status) params.set('status', status);
      if (type) params.set('type', type);
      return apiGet<{ recalls: Recall[] }>(`/recalls?${params.toString()}`);
    },
  });

  const patientsQuery = useQuery({
    queryKey: ['patients', 'for-recalls'],
    queryFn: () => apiGet<{ data: Patient[] }>('/patients', { take: 50 }),
    enabled: dialogOpen,
  });

  const configsQuery = useQuery({
    queryKey: ['recall-configs'],
    queryFn: getRecallConfigs,
  });

  const [configDrafts, setConfigDrafts] = useState<Record<string, { intervalDays: number; channel: 'sms' | 'email' | 'both'; isActive: boolean }>>({});
  const [scanRunning, setScanRunning] = useState(false);

  const handleRunScan = async () => {
    setScanRunning(true);
    try {
      const result = await runRecallScan();
      toast.success(result.created > 0 ? `Recall scan created ${result.created} recall${result.created === 1 ? '' : 's'}` : 'Scan complete — no new recalls needed');
      await queryClient.invalidateQueries({ queryKey: ['recalls'] });
    } catch {
      toast.error('Recall scan failed');
    } finally {
      setScanRunning(false);
    }
  };

  const handleSaveConfig = async (config: RecallTypeConfig) => {
    const draft = configDrafts[config.type];
    if (!draft || !Number.isFinite(draft.intervalDays) || draft.intervalDays < 1) {
      toast.error('Interval must be at least 1 day');
      return;
    }
    try {
      await updateRecallConfig(config.type, { intervalDays: draft.intervalDays, channel: draft.channel, isActive: draft.isActive });
      toast.success(`${config.type} recall schedule saved`);
      setConfigDrafts((prev) => {
        const next = { ...prev };
        delete next[config.type];
        return next;
      });
      await queryClient.invalidateQueries({ queryKey: ['recall-configs'] });
    } catch {
      toast.error('Failed to save recall schedule');
    }
  };

  const patientName = (patientIdValue: string) => {
    if (!patientIdValue) return '—';
    const patient = patientsQuery.data?.data.find((candidate) => candidate.id === patientIdValue);
    if (patient) return `${patient.firstName} ${patient.lastName}`;
    return `Patient ${patientIdValue.slice(0, 8)}…`;
  };

  const handleCreate = async () => {
    if (!patientId || !dueDate) {
      toast.error('Select a patient and due date');
      return;
    }
    setSaving(true);
    try {
      await apiPost('/recalls', { patientId, type: recallType, dueDate: new Date(dueDate).toISOString(), ...(notes.trim() ? { notes: notes.trim() } : {}) });
      toast.success('Recall created');
      setDialogOpen(false);
      setPatientId('');
      setDueDate('');
      setNotes('');
      await queryClient.invalidateQueries({ queryKey: ['recalls'] });
    } catch {
      toast.error('Failed to create recall');
    } finally {
      setSaving(false);
    }
  };

  const handleComplete = async (id: string) => {
    try {
      await apiPost(`/recalls/${id}/complete`, {});
      toast.success('Recall completed');
      refetch();
    } catch {
      toast.error('Failed to complete recall');
    }
  };

  const handleSchedule = async (recall: Recall) => {
    try {
      await apiPut(`/recalls/${recall.id}`, { status: 'booked', bookedAt: new Date().toISOString() });
      toast.success('Recall marked as booked');
      refetch();
    } catch {
      toast.error('Failed to update recall');
    }
  };

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Automated Recalls</h1>
            <p className="text-muted-foreground">Hygiene, periodontal and post-op recall queues</p>
          </div>
        </div>
        <div className="text-center py-12">
          <p className="text-destructive mb-4">Failed to load recalls</p>
          <Button onClick={() => refetch()} variant="outline">Retry</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Automated Recalls</h1>
          <p className="text-muted-foreground">Hygiene, periodontal and post-op recall queues</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={handleRunScan} disabled={scanRunning} className="gap-1.5">
            <RefreshCw className={cn('h-4 w-4', scanRunning && 'animate-spin')} />
            {scanRunning ? 'Scanning…' : 'Run recall scan'}
          </Button>
          <Button onClick={() => setDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            New Recall
          </Button>
        </div>
      </div>

      <div className="rounded-lg border p-4 space-y-3">
        <p className="flex items-center gap-1.5 text-sm font-semibold">
          <Timer className="h-4 w-4 text-muted-foreground" />
          Recall schedule
          <span className="font-normal text-xs text-muted-foreground">— recalls auto-generate once this interval passes since the patient's last completed visit</span>
        </p>
        {configsQuery.isLoading ? (
          <Skeleton className="h-16 w-full" />
        ) : (
          <div className="space-y-2">
            {(configsQuery.data ?? []).map((config) => {
              const draft = configDrafts[config.type] ?? { intervalDays: config.intervalDays, channel: config.channel, isActive: config.isActive };
              const dirty = draft.intervalDays !== config.intervalDays || draft.channel !== config.channel || draft.isActive !== config.isActive;
              return (
                <div key={config.id} className="flex flex-wrap items-center gap-x-4 gap-y-2 rounded-md border px-3 py-2">
                  <span className="w-40 text-sm font-medium capitalize">{config.type.replace(/_/g, ' ')}</span>
                  <label className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    Interval (days)
                    <Input
                      type="number"
                      min={1}
                      max={1825}
                      value={draft.intervalDays}
                      onChange={(event) => setConfigDrafts((prev) => ({ ...prev, [config.type]: { ...draft, intervalDays: Number(event.target.value) } }))}
                      className="h-8 w-24"
                    />
                  </label>
                  <select
                    value={draft.channel}
                    onChange={(event) => setConfigDrafts((prev) => ({ ...prev, [config.type]: { ...draft, channel: event.target.value as 'sms' | 'email' | 'both' } }))}
                    className="h-8 px-2 border rounded-md text-xs bg-background"
                    aria-label={`${config.type} contact channel`}
                  >
                    <option value="sms">SMS</option>
                    <option value="email">Email</option>
                    <option value="both">SMS + Email</option>
                  </select>
                  <label className="flex items-center gap-1.5 text-xs">
                    <input
                      type="checkbox"
                      checked={draft.isActive}
                      onChange={(event) => setConfigDrafts((prev) => ({ ...prev, [config.type]: { ...draft, isActive: event.target.checked } }))}
                    />
                    Auto-generate
                  </label>
                  <Button size="sm" variant={dirty ? 'default' : 'secondary'} disabled={!dirty} onClick={() => handleSaveConfig(config)} className="ml-auto h-8">
                    Save
                  </Button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search recalls..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="h-10 px-3 py-2 border rounded-md text-sm bg-background"
        >
          {STATUS_OPTIONS.map(option => (
            <option key={option.value} value={option.value}>{option.label}</option>
          ))}
        </select>
        <select
          value={type}
          onChange={(e) => setType(e.target.value)}
          className="h-10 px-3 py-2 border rounded-md text-sm bg-background"
        >
          {TYPE_OPTIONS.map(option => (
            <option key={option.value} value={option.value}>{option.label}</option>
          ))}
        </select>
      </div>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Patient</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Due Date</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-10"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                  <TableCell><Skeleton className="h-6 w-16 rounded-full" /></TableCell>
                  <TableCell><Skeleton className="h-8 w-8" /></TableCell>
                </TableRow>
              ))
            ) : data?.recalls?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-12 text-muted-foreground">
                  No recalls found
                </TableCell>
              </TableRow>
            ) : (
              data?.recalls?.map((recall) => (
                <TableRow key={recall.id}>
                  <TableCell className="font-medium">{patientName(recall.patientId)}</TableCell>
                  <TableCell className="capitalize">{recall.type.replace(/_/g, ' ')}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {new Date(recall.dueDate).toLocaleDateString('en-AU')}
                  </TableCell>
                  <TableCell>{getStatusBadge(recall.status)}</TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {recall.status !== 'completed' && (
                          <DropdownMenuItem onClick={() => handleComplete(recall.id)}>
                            <CheckCircle className="h-4 w-4 mr-2" />
                            Mark complete
                          </DropdownMenuItem>
                        )}
                        {recall.status !== 'booked' && recall.status !== 'completed' && (
                          <DropdownMenuItem onClick={() => handleSchedule(recall)}>
                            <Calendar className="h-4 w-4 mr-2" />
                            Mark booked
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>New recall</DialogTitle>
            <DialogDescription>Schedule a patient onto a hygiene, perio or post-op recall queue.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="recall-patient">Patient</Label>
              <Select id="recall-patient" value={patientId} onChange={(event) => setPatientId(event.target.value)}>
                <option value="">Select a patient…</option>
                {(patientsQuery.data?.data ?? []).map((patient) => (
                  <option key={patient.id} value={patient.id}>
                    {patient.firstName} {patient.lastName} ({patient.patientNumber})
                  </option>
                ))}
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="recall-type">Type</Label>
                <Select id="recall-type" value={recallType} onChange={(event) => setRecallType(event.target.value)}>
                  {TYPE_OPTIONS.filter((option) => option.value).map((option) => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="recall-due">Due date</Label>
                <Input id="recall-due" type="date" value={dueDate} onChange={(event) => setDueDate(event.target.value)} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="recall-notes">Notes</Label>
              <Input id="recall-notes" value={notes} onChange={(event) => setNotes(event.target.value)} placeholder="Optional" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={saving}>Cancel</Button>
            <Button onClick={handleCreate} disabled={saving}>{saving ? 'Saving…' : 'Create recall'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
