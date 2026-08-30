import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { Link } from '@tanstack/react-router';
import { Plus, FileText } from 'lucide-react';
import { Button } from '@danta/ui/button';
import { Badge } from '@danta/ui/badge';
import { Textarea } from '@danta/ui/textarea';
import { Input } from '@danta/ui/input';
import { Label } from '@danta/ui/label';
import { Skeleton } from '@danta/ui/skeleton';
import { Select } from '@danta/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@danta/ui/table';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@danta/ui/dialog';
import { apiGet, apiPost } from '../../lib/api/request';
import { createEstimateFromPlan } from '../../lib/api/estimates';
import { toast } from 'sonner';
import { tenantPath } from '../../lib/tenant-routing';
import { useAuth } from '../../lib/auth-context';

type TreatmentPlan = {
  id: string;
  patientId: string;
  name: string;
  status: string;
  createdAt: string;
};

function getStatusBadge(status: string) {
  const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
    draft: 'secondary',
    proposed: 'outline',
    approved: 'default',
    in_progress: 'default',
    completed: 'default',
    cancelled: 'destructive',
    rejected: 'destructive',
  };
  return <Badge variant={variants[status] || 'outline'}>{status.replaceAll('_', ' ')}</Badge>;
}

export function TreatmentPlansPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [patientId, setPatientId] = useState('');
  const [providerId, setProviderId] = useState('');
  const [name, setName] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['treatment-plans'],
    queryFn: () => apiGet<{ plans: TreatmentPlan[] }>('/treatment-plans'),
  });

  const patientsQuery = useQuery({
    queryKey: ['patients', 'for-plans'],
    queryFn: () => apiGet<{ data: Array<{ id: string; firstName: string; lastName: string; patientNumber?: string }>; total: number }>('/patients', { take: 200 }),
    enabled: open,
  });
  const providersQuery = useQuery({
    queryKey: ['providers', 'for-plans'],
    queryFn: () => apiGet<{ providers?: Array<{ id: string; firstName: string; lastName: string }> } | Array<{ id: string; firstName: string; lastName: string }>>('/providers'),
    enabled: open,
  });
  const providers = Array.isArray(providersQuery.data) ? providersQuery.data : providersQuery.data?.providers ?? [];

  const handleCreate = async () => {
    if (!name.trim() || !patientId || !providerId) return;
    setLoading(true);
    try {
      await apiPost('/treatment-plans', {
        patientId,
        providerId,
        name: name.trim(),
        status: 'draft',
        ...(notes.trim() ? { notes: notes.trim() } : {}),
      });
      toast.success('Treatment plan created');
      setOpen(false);
      setName('');
      setNotes('');
      setPatientId('');
      setProviderId('');
      refetch();
    } catch (caught) {
      toast.error(caught instanceof Error && caught.message ? caught.message : 'Failed to create treatment plan');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateEstimate = async (planId: string) => {
    try {
      const estimate = await createEstimateFromPlan({ treatmentPlanId: planId });
      toast.success(`Estimate ${estimate.estimateNumber} created`);
      queryClient.invalidateQueries({ queryKey: ['estimates'] });
    } catch (caught) {
      toast.error(caught instanceof Error && caught.message ? caught.message : 'Could not create the estimate');
    }
  };

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Treatment Plans</h1>
            <p className="text-muted-foreground">Manage treatment plans</p>
          </div>
        </div>
        <div className="text-center py-12">
          <p className="text-destructive mb-4">Failed to load treatment plans</p>
          <Button onClick={() => refetch()} variant="outline">Retry</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Treatment Plans</h1>
          <p className="text-muted-foreground">Manage treatment plans and patient estimates</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              New Plan
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>New Treatment Plan</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="plan-patient">Patient</Label>
                <Select id="plan-patient" value={patientId} onChange={(event) => setPatientId(event.target.value)}>
                  <option value="">Select a patient…</option>
                  {(patientsQuery.data?.data ?? []).map((patient) => (
                    <option key={patient.id} value={patient.id}>
                      {patient.firstName} {patient.lastName}{patient.patientNumber ? ` (${patient.patientNumber})` : ''}
                    </option>
                  ))}
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="plan-provider">Provider</Label>
                <Select id="plan-provider" value={providerId} onChange={(event) => setProviderId(event.target.value)}>
                  <option value="">Select a provider…</option>
                  {providers.map((provider) => (
                    <option key={provider.id} value={provider.id}>{provider.firstName} {provider.lastName}</option>
                  ))}
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="plan-name">Name</Label>
                <Input id="plan-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Upper left quadrant restorations" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="plan-notes">Notes</Label>
                <Textarea id="plan-notes" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Optional clinical context" />
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                <Button onClick={handleCreate} loading={loading} disabled={loading || !name.trim() || !patientId || !providerId}>Create Plan</Button>
              </DialogFooter>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Plan</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Created</TableHead>
              <TableHead>Patient</TableHead>
              <TableHead className="w-40 text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell><Skeleton className="h-4 w-48" /></TableCell>
                  <TableCell><Skeleton className="h-6 w-20 rounded-full" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                  <TableCell />
                </TableRow>
              ))
            ) : data?.plans?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-12 text-muted-foreground">
                  No treatment plans found — chart findings can generate one automatically.
                </TableCell>
              </TableRow>
            ) : (
              data?.plans?.map((plan) => (
                <TableRow key={plan.id}>
                  <TableCell className="font-medium">{plan.name}</TableCell>
                  <TableCell>{getStatusBadge(plan.status)}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {new Date(plan.createdAt).toLocaleDateString('en-AU')}
                  </TableCell>
                  <TableCell>
                    <Link to={tenantPath(user?.tenantId ?? '', `patients/${plan.patientId}/clinical`)} className="text-sm hover:underline">
                      Open clinical
                    </Link>
                  </TableCell>
                  <TableCell className="text-right">
                    {['draft', 'proposed'].includes(plan.status) && (
                      <Button variant="outline" size="sm" onClick={() => void handleCreateEstimate(plan.id)}>
                        <FileText className="h-3.5 w-3.5 mr-1" /> Create estimate
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <p className="text-sm text-muted-foreground">
        Estimates for this practice are managed on the{' '}
        <Link to={tenantPath(user?.tenantId ?? '', 'estimates')} className="underline hover:text-foreground">Estimates page</Link>.
      </p>
    </div>
  );
}
