import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { Link } from '@tanstack/react-router';
import { MoreHorizontal, FileText } from 'lucide-react';
import { Button } from '@danta/ui/button';
import { Badge } from '@danta/ui/badge';
import { Input } from '@danta/ui/input';
import { Label } from '@danta/ui/label';
import { Skeleton } from '@danta/ui/skeleton';
import { Select } from '@danta/ui/select';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@danta/ui/table';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from '@danta/ui/dropdown-menu';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@danta/ui/dialog';
import { toast } from 'sonner';
import { tenantPath } from '../../lib/tenant-routing';
import { useAuth } from '../../lib/auth-context';
import { getEstimates, presentEstimate, recordEstimateDecision, cancelEstimate, type EstimateVM } from '../../lib/api/estimates';

const STATUS_VARIANTS: Record<EstimateVM['status'], 'default' | 'secondary' | 'destructive' | 'outline'> = {
  draft: 'secondary',
  presented: 'outline',
  approved: 'default',
  partially_approved: 'default',
  rejected: 'destructive',
  expired: 'destructive',
  cancelled: 'destructive',
};

function money(value: number | string): string {
  return Number(value).toLocaleString('en-AU', { style: 'currency', currency: 'AUD' });
}

function DecisionDialog({ estimate, open, onOpenChange }: { estimate: EstimateVM; open: boolean; onOpenChange: (open: boolean) => void }) {
  const queryClient = useQueryClient();
  const [signerName, setSignerName] = useState('');
  const [method, setMethod] = useState<'in_person' | 'written' | 'electronic' | 'verbal'>('in_person');
  const [decision, setDecision] = useState<'approved' | 'rejected' | 'partially_approved'>('approved');
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    if (!signerName.trim()) {
      toast.error('The signer name is required');
      return;
    }
    setSaving(true);
    try {
      await recordEstimateDecision(estimate.id, { decision, signerName: signerName.trim(), method });
      toast.success(decision === 'approved' ? 'Estimate approved' : decision === 'rejected' ? 'Estimate declined' : 'Partially approved');
      queryClient.invalidateQueries({ queryKey: ['estimates'] });
      onOpenChange(false);
    } catch (error) {
      toast.error(error instanceof Error && error.message ? error.message : 'Could not record the patient decision');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Record patient decision — {estimate.estimateNumber}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="dec-signer">Signer name</Label>
            <Input id="dec-signer" value={signerName} onChange={(e) => setSignerName(e.target.value)} placeholder="Patient or guardian full name" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="dec-decision">Decision</Label>
              <Select id="dec-decision" value={decision} onChange={(e) => setDecision(e.target.value as typeof decision)}>
                <option value="approved">Approved</option>
                <option value="partially_approved">Partially approved</option>
                <option value="rejected">Declined</option>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="dec-method">Method</Label>
              <Select id="dec-method" value={method} onChange={(e) => setMethod(e.target.value as typeof method)}>
                <option value="in_person">In person</option>
                <option value="written">Written</option>
                <option value="electronic">Electronic</option>
                <option value="verbal">Verbal</option>
              </Select>
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            The signer details, method, time and your user account are stored permanently as approval evidence.
          </p>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>Cancel</Button>
          <Button onClick={submit} disabled={saving}>{saving ? 'Recording…' : 'Record decision'}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function EstimatesPage() {
  const { permissions } = useAuth();
  const canManage = permissions.includes('billing:create');
  const queryClient = useQueryClient();
  const [decisionFor, setDecisionFor] = useState<EstimateVM | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['estimates'],
    queryFn: () => getEstimates(),
  });

  const act = async (action: () => Promise<unknown>, successMessage: string) => {
    try {
      await action();
      toast.success(successMessage);
      queryClient.invalidateQueries({ queryKey: ['estimates'] });
    } catch (error) {
      toast.error(error instanceof Error && error.message ? error.message : 'Action failed');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-semibold tracking-tight"><FileText className="h-6 w-6" /> Estimates</h1>
          <p className="text-muted-foreground">Costed treatment estimates and patient approvals</p>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-2">{[0, 1, 2].map((i) => <Skeleton key={i} className="h-12 w-full" />)}</div>
      ) : !data || data.length === 0 ? (
        <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
          No estimates yet — create one from a treatment plan.
        </div>
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Number</TableHead>
                <TableHead>Patient</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Total (AUD)</TableHead>
                <TableHead>GST</TableHead>
                <TableHead>Valid until</TableHead>
                <TableHead className="w-10" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((estimate) => (
                <TableRow key={estimate.id}>
                  <TableCell className="font-medium">{estimate.estimateNumber}</TableCell>
                  <TableCell>
                    <Link to={tenantPath(estimate.patientId, `patients/${estimate.patientId}`)} className="text-sm hover:underline">
                      View patient
                    </Link>
                  </TableCell>
                  <TableCell><Badge variant={STATUS_VARIANTS[estimate.status]}>{estimate.status.replaceAll('_', ' ')}</Badge></TableCell>
                  <TableCell>{money(estimate.total)}</TableCell>
                  <TableCell>{money(estimate.tax)}</TableCell>
                  <TableCell>{estimate.validUntil ? new Date(estimate.validUntil).toLocaleDateString('en-AU') : '—'}</TableCell>
                  <TableCell>
                    {canManage && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" aria-label={`Actions for ${estimate.estimateNumber}`}>
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {estimate.status === 'draft' && (
                            <DropdownMenuItem onSelect={() => void act(() => presentEstimate(estimate.id), 'Estimate marked as presented')}>
                              Mark as presented
                            </DropdownMenuItem>
                          )}
                          {estimate.status === 'presented' && (
                            <DropdownMenuItem onSelect={() => setDecisionFor(estimate)}>Record patient decision…</DropdownMenuItem>
                          )}
                          {!['approved', 'rejected', 'cancelled'].includes(estimate.status) && (
                            <>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                className="text-destructive"
                                onSelect={() => void act(() => cancelEstimate(estimate.id), 'Estimate cancelled')}
                              >
                                Cancel estimate
                              </DropdownMenuItem>
                            </>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {decisionFor && (
        <DecisionDialog estimate={decisionFor} open={Boolean(decisionFor)} onOpenChange={(open) => !open && setDecisionFor(null)} />
      )}
    </div>
  );
}
