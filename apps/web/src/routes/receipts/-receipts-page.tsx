import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { Printer, Search, Eye } from 'lucide-react';
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
import { apiGet } from '../../lib/api/request';
import type { Payment } from '@danta/schemas';
import { formatCurrency } from '../../lib/format';

type PaymentRow = Payment & {
  allocations: Array<{ id: string; amount: string; invoice: { id: string; invoiceNumber: string; total: string; balance: string } }>;
};

type Receipt = {
  paymentId?: string;
  receiptNumber?: string;
  issuedAt?: string;
  patient?: { firstName: string; lastName: string; patientNumber?: string };
  payment?: { method?: string; amount?: number | string; receivedAt?: string; reference?: string };
  items?: Array<{ description?: string; invoiceNumber?: string; amountApplied?: number | string }>;
  total?: number | string;
};

export function ReceiptsPage() {
  const [search, setSearch] = useState('');
  const [selectedPaymentId, setSelectedPaymentId] = useState<string | null>(null);

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['payments', 'for-receipts', search],
    queryFn: async () => {
      return apiGet<{ data: PaymentRow[]; total: number }>('/payments', { take: 50 });
    },
  });

  const receiptQuery = useQuery({
    queryKey: ['receipt', selectedPaymentId],
    queryFn: () => apiGet<Receipt>(`/receipts/${selectedPaymentId}`),
    enabled: !!selectedPaymentId,
  });

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Receipts</h1>
            <p className="text-muted-foreground">Payments and printable receipts</p>
          </div>
        </div>
        <div className="text-center py-12">
          <p className="text-destructive mb-4">Failed to load payments</p>
          <Button onClick={() => refetch()} variant="outline">Retry</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Receipts</h1>
          <p className="text-muted-foreground">Payments and printable receipts</p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Filter payments..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Received</TableHead>
              <TableHead>Method</TableHead>
              <TableHead>Invoices</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Status</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                  <TableCell><Skeleton className="h-6 w-16 rounded-full" /></TableCell>
                  <TableCell><Skeleton className="h-8 w-8" /></TableCell>
                </TableRow>
              ))
            ) : data?.data?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-12 text-muted-foreground">
                  No payments found
                </TableCell>
              </TableRow>
            ) : (
              data?.data?.map((payment) => (
                <TableRow key={payment.id}>
                  <TableCell>{new Date(payment.receivedAt).toLocaleDateString('en-AU')}</TableCell>
                  <TableCell className="capitalize">{String(payment.method).replace(/_/g, ' ')}</TableCell>
                  <TableCell className="font-mono text-xs text-muted-foreground">
                    {payment.allocations.map((allocation) => allocation.invoice.invoiceNumber).join(', ') || '—'}
                  </TableCell>
                  <TableCell className="font-medium">{formatCurrency(Number(payment.amount))}</TableCell>
                  <TableCell>
                    <Badge variant={String(payment.status) === 'completed' ? 'default' : 'secondary'}>
                      {String(payment.status).replace(/_/g, ' ')}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      aria-label="View receipt"
                      onClick={() => setSelectedPaymentId(payment.id)}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={!!selectedPaymentId} onOpenChange={(open) => !open && setSelectedPaymentId(null)}>
        <DialogContent className="max-w-md print-area">
          <DialogHeader>
            <DialogTitle>Receipt</DialogTitle>
            <DialogDescription>
              {receiptQuery.data?.receiptNumber ?? `Receipt for payment ${selectedPaymentId?.slice(0, 8)}`}
            </DialogDescription>
          </DialogHeader>
          {receiptQuery.isLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
            </div>
          ) : receiptQuery.error ? (
            <p className="text-sm text-destructive">Failed to load receipt.</p>
          ) : (
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Issued</span>
                <span>{formatDate(receiptQuery.data?.issuedAt ?? receiptQuery.data?.payment?.receivedAt)}</span>
              </div>
              {receiptQuery.data?.patient && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Patient</span>
                  <span>{receiptQuery.data.patient.firstName} {receiptQuery.data.patient.lastName}</span>
                </div>
              )}
              {(receiptQuery.data?.items ?? []).map((item, index) => (
                <div key={index} className="flex justify-between gap-4">
                  <span className="text-muted-foreground truncate">{item.description ?? item.invoiceNumber ?? 'Allocation'}</span>
                  <span>{formatCurrency(Number(item.amountApplied ?? 0))}</span>
                </div>
              ))}
              <div className="flex justify-between border-t pt-2 font-semibold">
                <span>Total paid</span>
                <span>{formatCurrency(Number(receiptQuery.data?.total ?? receiptQuery.data?.payment?.amount ?? 0))}</span>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedPaymentId(null)}>Close</Button>
            <Button
              className="gap-1.5 no-print"
              disabled={receiptQuery.isLoading || !!receiptQuery.error}
              onClick={() => window.print()}
            >
              <Printer className="h-4 w-4" />
              Print
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function formatDate(value?: string): string {
  if (!value) return '—';
  return new Date(value).toLocaleDateString('en-AU');
}
