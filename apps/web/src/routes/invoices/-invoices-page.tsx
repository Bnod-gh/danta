import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { Banknote, Eye, Printer, Undo2 } from 'lucide-react';
import { Button } from '@danta/ui/button';
import { Input } from '@danta/ui/input';
import { Badge } from '@danta/ui/badge';
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@danta/ui/table';
import { getInvoice, getInvoices, type InvoiceRow } from '../../lib/api/claims';
import { RecordPaymentDialog, RefundPaymentDialog } from '../../components/billing/PaymentRefundDialogs';
import { formatCurrency } from '../../lib/format';
import { Link } from '@tanstack/react-router';
import { tenantPath } from '../../lib/tenant-routing';
import { useAuth } from '../../lib/auth-context';

const STATUS_OPTIONS = [
  { value: '', label: 'All statuses' },
  { value: 'draft', label: 'Draft' },
  { value: 'issued', label: 'Issued' },
  { value: 'partially_paid', label: 'Partially Paid' },
  { value: 'paid', label: 'Paid' },
  { value: 'voided', label: 'Voided' },
  { value: 'written_off', label: 'Written Off' },
];

function getStatusBadge(status: string) {
  const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
    draft: 'secondary',
    issued: 'outline',
    partially_paid: 'default',
    paid: 'default',
    voided: 'destructive',
    written_off: 'destructive',
  };
  return <Badge variant={variants[status] || 'outline'}>{status.replace(/_/g, ' ')}</Badge>;
}

export function InvoicesPage({ patientId }: { patientId?: string } = {}) {
  const { user } = useAuth();
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [statementFor, setStatementFor] = useState<string | null>(null);
  const [paymentFor, setPaymentFor] = useState<InvoiceRow | null>(null);
  const [refundFor, setRefundFor] = useState<InvoiceRow | null>(null);

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['invoices', patientId, search, status],
    queryFn: () => getInvoices({ search: search || undefined, status: status || undefined, patientId: patientId || undefined, take: 50 }),
  });

  const statementQuery = useQuery({
    queryKey: ['invoice-statement', statementFor],
    queryFn: () => getInvoice(statementFor!),
    enabled: !!statementFor,
  });

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Invoices</h1>
            <p className="text-muted-foreground">Manage invoices and insurance splits</p>
          </div>
        </div>
        <div className="text-center py-12">
          <p className="text-destructive mb-4">Failed to load invoices</p>
          <Button onClick={() => refetch()} variant="outline">Retry</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Invoices</h1>
          <p className="text-muted-foreground">Manage invoices and insurance splits</p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Input
            placeholder="Search by invoice number..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
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
      </div>

      <div className="border rounded-lg overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Invoice</TableHead>
              <TableHead>Patient</TableHead>
              <TableHead>Total</TableHead>
              <TableHead>GST</TableHead>
              <TableHead>Insured</TableHead>
              <TableHead>Patient Pays</TableHead>
              <TableHead>Balance</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-28" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                  <TableCell><Skeleton className="h-6 w-24 rounded-full" /></TableCell>
                  <TableCell><Skeleton className="h-8 w-16" /></TableCell>
                </TableRow>
              ))
            ) : data?.data?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center py-12 text-muted-foreground">
                  No invoices found
                </TableCell>
              </TableRow>
            ) : (
              data?.data?.map((invoice) => (
                <TableRow key={invoice.id}>
                  <TableCell className="font-mono text-xs font-medium">{invoice.invoiceNumber}</TableCell>
                  <TableCell>
                    <p className="text-sm">{invoice.patient?.firstName} {invoice.patient?.lastName}</p>
                    {invoice.patient?.patientNumber && (
                      <p className="text-xs text-muted-foreground">#{invoice.patient.patientNumber}</p>
                    )}
                  </TableCell>
                  <TableCell>{formatCurrency(Number(invoice.total))}</TableCell>
                  <TableCell className="text-muted-foreground">{formatCurrency(Number(invoice.tax))}</TableCell>
                  <TableCell className="text-sky-700 dark:text-sky-300">{formatCurrency(Number(invoice.insuranceAmount))}</TableCell>
                  <TableCell className="font-medium">{formatCurrency(Number(invoice.patientAmount))}</TableCell>
                  <TableCell className={Number(invoice.balance) > 0 ? 'font-semibold text-red-600' : ''}>{formatCurrency(Number(invoice.balance))}</TableCell>
                  <TableCell>{getStatusBadge(invoice.status)}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      {Number(invoice.balance) > 0 && !['voided', 'written_off'].includes(invoice.status) && (
                        <Button variant="ghost" size="icon" className="h-7 w-7" aria-label={`Record payment for ${invoice.invoiceNumber}`} onClick={() => setPaymentFor(invoice)}>
                          <Banknote className="h-3.5 w-3.5" />
                        </Button>
                      )}
                      {Number(invoice.balance) < Number(invoice.total) && (
                        <Button variant="ghost" size="icon" className="h-7 w-7" aria-label={`Refund ${invoice.invoiceNumber}`} onClick={() => setRefundFor(invoice)}>
                          <Undo2 className="h-3.5 w-3.5" />
                        </Button>
                      )}
                      <Button variant="ghost" size="icon" className="h-7 w-7" aria-label="Print statement" onClick={() => setStatementFor(invoice.id)}>
                        <Printer className="h-3.5 w-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7" asChild>
                        <Link to={tenantPath(user?.tenantId, `/invoices/${invoice.id}`)} aria-label="View invoice">
                          <Eye className="h-3.5 w-3.5" />
                        </Link>
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={!!statementFor} onOpenChange={(open) => !open && setStatementFor(null)}>        <DialogContent className="max-w-md print-area">
          <DialogHeader>
            <DialogTitle>Account statement</DialogTitle>
            <DialogDescription>{statementQuery.data?.invoiceNumber ?? 'Loadingâ€¦'}</DialogDescription>
          </DialogHeader>
          {statementQuery.isLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-4 w-full" />)}
            </div>
          ) : statementQuery.error || !statementQuery.data ? (
            <p className="text-sm text-destructive">Failed to load invoice.</p>
          ) : (
            <StatementBody invoice={statementQuery.data} />
          )}
          <DialogFooter>
            <Button variant="outline" className="no-print" onClick={() => setStatementFor(null)}>Close</Button>
            <Button className="gap-1.5 no-print" disabled={statementQuery.isLoading || !!statementQuery.error} onClick={() => window.print()}>
              <Printer className="h-4 w-4" />
              Print
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {paymentFor && (
        <RecordPaymentDialog
          invoice={{
            id: paymentFor.id,
            invoiceNumber: paymentFor.invoiceNumber,
            patientId: paymentFor.patientId,
            patientName: `${paymentFor.patient?.firstName ?? ''} ${paymentFor.patient?.lastName ?? ''}`.trim(),
            balance: Number(paymentFor.balance),
          }}
          open={Boolean(paymentFor)}
          onOpenChange={(open) => !open && setPaymentFor(null)}
        />
      )}
      {refundFor && (
        <RefundPaymentDialog
          invoice={{
            id: refundFor.id,
            invoiceNumber: refundFor.invoiceNumber,
            patientId: refundFor.patientId,
            patientName: `${refundFor.patient?.firstName ?? ''} ${refundFor.patient?.lastName ?? ''}`.trim(),
            total: Number(refundFor.total),
          }}
          open={Boolean(refundFor)}
          onOpenChange={(open) => !open && setRefundFor(null)}
        />
      )}
    </div>
  );
}

function StatementBody({ invoice }: { invoice: InvoiceRow }) {
  return (
    <div className="space-y-2 text-sm">
      <div className="flex justify-between">
        <span className="text-muted-foreground">Patient</span>
        <span className="font-medium">{invoice.patient?.firstName} {invoice.patient?.lastName}</span>
      </div>
      <div className="flex justify-between">
        <span className="text-muted-foreground">Issued</span>
        <span>{new Date(invoice.issueDate).toLocaleDateString('en-AU')}</span>
      </div>
      <div className="border-t pt-2">
        {invoice.items.map((item) => (
          <div key={item.id} className="flex justify-between gap-3 py-0.5">
            <span className="text-muted-foreground truncate">
              {item.cdtCode ? `[${item.cdtCode}] ` : ''}{item.description} Ã—{item.quantity}
            </span>
            <span>{formatCurrency(Number(item.total))}</span>
          </div>
        ))}
      </div>
      <div className="border-t pt-2 space-y-1">
        <div className="flex justify-between">
          <span className="text-muted-foreground">Insurance covers</span>
          <span>{formatCurrency(Number(invoice.insuranceAmount))}</span>
        </div>
        <div className="flex justify-between font-semibold">
          <span>Patient responsibility</span>
          <span>{formatCurrency(Number(invoice.patientAmount))}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Outstanding balance</span>
          <span className={Number(invoice.balance) > 0 ? 'font-semibold text-red-600' : ''}>{formatCurrency(Number(invoice.balance))}</span>
        </div>
      </div>
    </div>
  );
}
