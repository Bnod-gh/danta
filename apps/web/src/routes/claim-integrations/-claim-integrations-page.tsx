import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { FileText, History, Plus, Send } from 'lucide-react';
import { Button } from '@danta/ui/button';
import { Input } from '@danta/ui/input';
import { Label } from '@danta/ui/label';
import { badgeVariants } from '@danta/ui/badge';
import { Skeleton } from '@danta/ui/skeleton';
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@danta/ui/dropdown-menu';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@danta/ui/table';
import { cn } from '@danta/ui/utils';
import { apiGet } from '../../lib/api/request';
import { createClaim, getClaims, getClaimHistory, submitClaim, updateClaimStatus, type ClaimRow } from '../../lib/api/claims';
import { getInvoices } from '../../lib/api/claims';
import { allowedClaimTransitions, type InsuranceClaimStatus } from '@danta/schemas';
import { formatCurrency } from '../../lib/format';
import { toast } from 'sonner';

const STATUS_BADGES: Record<InsuranceClaimStatus, string> = {
  draft: 'bg-secondary text-secondary-foreground',
  submitted: 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300',
  in_review: 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300',
  paid: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300',
  partially_paid: 'bg-teal-100 text-teal-800 dark:bg-teal-950 dark:text-teal-300',
  denied: 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300',
  cancelled: 'bg-muted text-muted-foreground',
};

const STATUS_LABELS: Record<InsuranceClaimStatus, string> = {
  draft: 'Draft',
  submitted: 'Submitted',
  in_review: 'In Review',
  paid: 'Paid',
  partially_paid: 'Partially Paid',
  denied: 'Denied',
  cancelled: 'Cancelled',
};

const NEXT_ACTION_LABEL: Partial<Record<InsuranceClaimStatus, string>> = {
  submitted: 'Mark In Review',
  in_review: 'Mark Paid',
  partially_paid: 'Mark Fully Paid',
  denied: 'Resubmit',
};

export function ClaimIntegrationsPage() {
  const [statusFilter, setStatusFilter] = useState('');
  const [newClaimOpen, setNewClaimOpen] = useState(false);
  const [payDialog, setPayDialog] = useState<{ claim: ClaimRow; target: InsuranceClaimStatus } | null>(null);
  const [paidAmount, setPaidAmount] = useState('');
  const [historyFor, setHistoryFor] = useState<ClaimRow | null>(null);
  const queryClient = useQueryClient();

  const claimsQuery = useQuery({
    queryKey: ['claims', statusFilter],
    queryFn: () => getClaims(statusFilter ? { status: statusFilter as InsuranceClaimStatus } : {}),
  });

  const integrationsQuery = useQuery({
    queryKey: ['claim-integrations', 'list'],
    queryFn: () => apiGet<Array<{ id: string; name: string; provider: string; isActive: boolean }>>('/claim-integrations'),
  });

  const openInvoicesQuery = useQuery({
    queryKey: ['invoices', 'for-claims'],
    queryFn: () => getInvoices({ take: 50 }),
    enabled: newClaimOpen,
  });

  const historyQuery = useQuery({
    queryKey: ['claim-history', historyFor?.id],
    queryFn: () => getClaimHistory(historyFor!.id),
    enabled: !!historyFor,
  });

  const refresh = () => queryClient.invalidateQueries({ queryKey: ['claims'] });

  const handleCreate = async (invoiceId: string, integrationId?: string, notes?: string) => {
    try {
      await createClaim({ invoiceId, ...(integrationId ? { integrationId } : {}), ...(notes?.trim() ? { notes: notes.trim() } : {}) });
      toast.success('Claim draft created');
      setNewClaimOpen(false);
      await refresh();
    } catch (error) {
      const message = error instanceof Error && error.message.includes('insurable') ? 'Invoice has no insurable amount outstanding' : 'Failed to create claim';
      toast.error(message);
    }
  };

  const handleSubmit = async (claim: ClaimRow) => {
    try {
      await submitClaim(claim.id, claim.integrationId ?? undefined);
      toast.success(`${claim.claimNumber} submitted`);
      await refresh();
    } catch {
      toast.error('Failed to submit claim');
    }
  };

  const handleStatus = async (claim: ClaimRow, status: InsuranceClaimStatus, paidAmount?: number) => {
    try {
      await updateClaimStatus(claim.id, {
        status,
        ...(paidAmount != null ? { paidAmount } : {}),
      });
      toast.success(`${claim.claimNumber} → ${STATUS_LABELS[status]}`);
      setPayDialog(null);
      await refresh();
    } catch {
      toast.error('Failed to update claim status');
    }
  };

  const claimableInvoices = (openInvoicesQuery.data?.data ?? []).filter(
    (invoice) => ['draft', 'issued', 'partially_paid'].includes(invoice.status) && Number(invoice.balance) > 0,
  );
  const counts = (claimsQuery.data ?? []).reduce<Record<string, number>>((acc, claim) => {
    acc[claim.status] = (acc[claim.status] ?? 0) + 1;
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Insurance Claims</h1>
          <p className="text-muted-foreground">Track claims through the insurer lifecycle</p>
        </div>
        <Button onClick={() => setNewClaimOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          New Claim
        </Button>
      </div>

      <div className="flex flex-wrap gap-2">
        {(['', 'draft', 'submitted', 'in_review', 'paid', 'denied'] as const).map((filter) => (
          <button
            key={filter || 'all'}
            type="button"
            onClick={() => setStatusFilter(filter)}
            className={cn(
              'rounded-full px-3 py-1 text-xs font-medium border transition-colors',
              statusFilter === filter ? 'bg-primary text-primary-foreground border-primary' : 'bg-background hover:bg-muted',
            )}
          >
            {filter ? STATUS_LABELS[filter] : 'All'}{filter && claimsQuery.data ? ` (${counts[filter] ?? 0})` : ''}
          </button>
        ))}
      </div>

      <div className="border rounded-lg overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Claim</TableHead>
              <TableHead>Patient</TableHead>
              <TableHead>Invoice</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Paid</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-24" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {claimsQuery.isLoading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell><Skeleton className="h-4 w-28" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                  <TableCell><Skeleton className="h-6 w-20 rounded-full" /></TableCell>
                  <TableCell><Skeleton className="h-8 w-8" /></TableCell>
                </TableRow>
              ))
            ) : (claimsQuery.data?.length ?? 0) === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-12 text-muted-foreground">
                  No claims yet — create one from an issued invoice.
                </TableCell>
              </TableRow>
            ) : (
              claimsQuery.data!.map((claim) => {
                const transitions = allowedClaimTransitions(claim.status);
                return (
                  <TableRow key={claim.id}>
                    <TableCell>
                      <p className="font-mono text-xs font-semibold">{claim.claimNumber}</p>
                      {claim.externalClaimId && <p className="text-[10px] text-muted-foreground">ext: {claim.externalClaimId}</p>}
                    </TableCell>
                    <TableCell>
                      <p className="text-sm font-medium">{claim.patient.firstName} {claim.patient.lastName}</p>
                      <p className="text-xs text-muted-foreground">#{claim.patient.patientNumber}</p>
                    </TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground">{claim.invoice?.invoiceNumber ?? '—'}</TableCell>
                    <TableCell className="font-medium">{formatCurrency(Number(claim.amount))}</TableCell>
                    <TableCell>{claim.paidAmount != null ? formatCurrency(Number(claim.paidAmount)) : '—'}</TableCell>
                    <TableCell>
                      <span className={cn(badgeVariants(), STATUS_BADGES[claim.status])}>{STATUS_LABELS[claim.status]}</span>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button variant="ghost" size="icon" className="h-7 w-7" aria-label="Claim history" onClick={() => setHistoryFor(claim)}>
                          <History className="h-3.5 w-3.5" />
                        </Button>
                        {transitions.length > 0 && (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-7 w-7" aria-label="Claim actions">
                                <Send className="h-3.5 w-3.5 rotate-[-45deg]" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              {transitions.includes('submitted') && (
                                <DropdownMenuItem onClick={() => handleSubmit(claim)}>
                                  <Send className="h-3.5 w-3.5 mr-2" />
                                  {claim.status === 'denied' ? 'Resubmit' : 'Submit to insurer'}
                                </DropdownMenuItem>
                              )}
                              {transitions.includes('in_review') && (
                                <DropdownMenuItem onClick={() => handleStatus(claim, 'in_review')}>
                                  Mark In Review
                                </DropdownMenuItem>
                              )}
                              {transitions.includes('paid') && (
                                <DropdownMenuItem onClick={() => { setPayDialog({ claim, target: 'paid' }); setPaidAmount(String(claim.amount)); }}>
                                  {claim.status === 'partially_paid' ? 'Mark Fully Paid' : 'Mark Paid'}
                                </DropdownMenuItem>
                              )}
                              {transitions.includes('partially_paid') && (
                                <DropdownMenuItem onClick={() => { setPayDialog({ claim, target: 'partially_paid' }); setPaidAmount(''); }}>
                                  Mark Partially Paid
                                </DropdownMenuItem>
                              )}
                              {transitions.includes('denied') && (
                                <>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem className="text-destructive" onClick={() => handleStatus(claim, 'denied')}>
                                    Mark Denied
                                  </DropdownMenuItem>
                                </>
                              )}
                              {transitions.includes('cancelled') && (
                                <DropdownMenuItem className="text-destructive" onClick={() => handleStatus(claim, 'cancelled')}>
                                  Cancel claim
                                </DropdownMenuItem>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      <Card title="Insurer integrations">
        <div className="flex flex-wrap gap-2">
          {(integrationsQuery.data ?? []).map((integration) => (
            <span key={integration.id} className="inline-flex items-center gap-2 rounded-md border px-3 py-1.5 text-xs">
              <span className={cn('h-2 w-2 rounded-full', integration.isActive ? 'bg-emerald-500' : 'bg-muted-foreground/40')} />
              {integration.name}
              <span className="text-muted-foreground">({integration.provider})</span>
            </span>
          ))}
          {(integrationsQuery.data ?? []).length === 0 && (
            <p className="text-sm text-muted-foreground">No insurer integrations configured.</p>
          )}
        </div>
      </Card>

      <NewClaimDialog
        open={newClaimOpen}
        onOpenChange={setNewClaimOpen}
        invoices={claimableInvoices}
        integrations={integrationsQuery.data ?? []}
        loading={openInvoicesQuery.isLoading}
        onCreate={handleCreate}
      />

      <Dialog open={!!payDialog} onOpenChange={(open) => !open && setPayDialog(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>{payDialog ? NEXT_ACTION_LABEL[payDialog.target] ?? STATUS_LABELS[payDialog.target] : ''}</DialogTitle>
            <DialogDescription>{payDialog?.claim.claimNumber} · {formatCurrency(Number(payDialog?.claim.amount ?? 0))} claimed</DialogDescription>
          </DialogHeader>
          <div className="space-y-1.5">
            <Label htmlFor="claim-paid-amount">Paid amount (AUD)</Label>
            <Input id="claim-paid-amount" type="number" min={0} step={0.01} value={paidAmount} onChange={(event) => setPaidAmount(event.target.value)} />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPayDialog(null)}>Cancel</Button>
            <Button
              onClick={() => {
                const amount = Number(paidAmount);
                if (!Number.isFinite(amount) || amount < 0) {
                  toast.error('Enter a valid paid amount');
                  return;
                }
                if (payDialog) void handleStatus(payDialog.claim, payDialog.target, amount);
              }}
            >
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!historyFor} onOpenChange={(open) => !open && setHistoryFor(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Claim history</DialogTitle>
            <DialogDescription>{historyFor?.claimNumber}</DialogDescription>
          </DialogHeader>
          <ol className="space-y-2">
            {(historyQuery.data ?? []).map((entry) => (
              <li key={entry.id} className="flex items-center gap-2 text-sm">
                <span className={cn(badgeVariants(), STATUS_BADGES[entry.status], 'text-[10px]')}>{STATUS_LABELS[entry.status]}</span>
                <span className="text-muted-foreground text-xs">
                  {new Date(entry.createdAt).toLocaleString('en-AU', { dateStyle: 'short', timeStyle: 'short' })}
                  {entry.note ? ` — ${entry.note}` : ''}
                </span>
              </li>
            ))}
            {(historyQuery.data?.length ?? 0) === 0 && <p className="text-sm text-muted-foreground">No history recorded.</p>}
          </ol>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-lg border p-4">
      <p className="mb-2 flex items-center gap-1.5 text-sm font-semibold">
        <FileText className="h-4 w-4 text-muted-foreground" />
        {title}
      </p>
      {children}
    </div>
  );
}

function NewClaimDialog({
  open,
  onOpenChange,
  invoices,
  integrations,
  loading,
  onCreate,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  invoices: import('../../lib/api/claims').InvoiceRow[];
  integrations: Array<{ id: string; name: string; isActive: boolean }>;
  loading: boolean;
  onCreate: (invoiceId: string, integrationId?: string, notes?: string) => Promise<void>;
}) {
  const [invoiceId, setInvoiceId] = useState('');
  const [integrationId, setIntegrationId] = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  const selected = invoices.find((invoice) => invoice.id === invoiceId);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>New insurance claim</DialogTitle>
          <DialogDescription>Creates a draft claim from an issued invoice. Claim amount defaults to the insured portion.</DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="claim-invoice">Invoice</Label>
            <Select id="claim-invoice" value={invoiceId} onChange={(event) => setInvoiceId(event.target.value)}>
              <option value="">Select an open invoice…</option>
              {invoices.map((invoice) => (
                <option key={invoice.id} value={invoice.id}>
                  {invoice.invoiceNumber} · {invoice.patient.firstName} {invoice.patient.lastName} · insured {formatCurrency(Number(invoice.insuranceAmount))}
                </option>
              ))}
            </Select>
            {selected && (
              <p className="text-xs text-muted-foreground">
                Total {formatCurrency(Number(selected.total))} · insured {formatCurrency(Number(selected.insuranceAmount))} · balance {formatCurrency(Number(selected.balance))}
              </p>
            )}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="claim-integration">Insurer channel</Label>
            <Select id="claim-integration" value={integrationId} onChange={(event) => setIntegrationId(event.target.value)}>
              <option value="">Auto-assign on submit</option>
              {integrations.map((integration) => (
                <option key={integration.id} value={integration.id}>{integration.name}</option>
              ))}
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="claim-notes">Notes</Label>
            <Input id="claim-notes" value={notes} onChange={(event) => setNotes(event.target.value)} placeholder="Optional" />
          </div>
          {loading && <Skeleton className="h-8 w-full" />}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>Cancel</Button>
          <Button
            disabled={saving || !invoiceId}
            onClick={async () => {
              setSaving(true);
              await onCreate(invoiceId, integrationId || undefined, notes);
              setSaving(false);
              setInvoiceId('');
              setIntegrationId('');
              setNotes('');
            }}
            className="gap-1.5"
          >
            <FileText className="h-4 w-4" />
            {saving ? 'Creating…' : 'Create draft claim'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
