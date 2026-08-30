import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { Search, Plus } from 'lucide-react';
import { Button } from '@danta/ui/button';
import { Input } from '@danta/ui/input';
import { Badge } from '@danta/ui/badge';
import { Skeleton } from '@danta/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@danta/ui/table';
import { apiGet } from '../../lib/api/request';
import type { RefundVM } from '../../lib/api/billing-payments';
import { Link } from '@tanstack/react-router';

const STATUS_OPTIONS = [
  { value: '', label: 'All statuses' },
  { value: 'pending', label: 'Pending' },
  { value: 'completed', label: 'Completed' },
  { value: 'failed', label: 'Failed' },
];

function getStatusBadge(status: string) {
  const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
    pending: 'secondary',
    completed: 'default',
    failed: 'destructive',
  };
  return <Badge variant={variants[status] || 'outline'}>{status}</Badge>;
}

export function RefundsPage() {
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['refunds', search, status],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      if (status) params.set('status', status);
      const response = await apiGet<{ data: RefundVM[]; total: number; skip: number; take: number }>(`/refunds?${params.toString()}`);
      return response;
    },
  });

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Refunds</h1>
            <p className="text-muted-foreground">Manage refunds and credit notes</p>
          </div>
        </div>
        <div className="text-center py-12">
          <p className="text-destructive mb-4">Failed to load refunds</p>
          <Button onClick={() => refetch()} variant="outline">Retry</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Refunds</h1>
          <p className="text-muted-foreground">Manage refunds and credit notes</p>
        </div>
        <Button asChild>
          <Link to="/invoices">
            <Plus className="h-4 w-4 mr-2" />
            New Refund
          </Link>
        </Button>
      </div>

      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search refunds..."
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
      </div>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Payment</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Reason</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                  <TableCell><Skeleton className="h-6 w-16 rounded-full" /></TableCell>
                </TableRow>
              ))
            ) : data?.data?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-12 text-muted-foreground">
                  No refunds found
                </TableCell>
              </TableRow>
            ) : (
              data?.data?.map((refund) => (
                <TableRow key={refund.id}>
                  <TableCell className="text-muted-foreground">{new Date(refund.createdAt).toLocaleDateString('en-AU')}</TableCell>
                  <TableCell className="text-muted-foreground">Payment {refund.paymentId.slice(0, 8)}...</TableCell>
                  <TableCell>${Number(refund.amount).toFixed(2)}</TableCell>
                  <TableCell className="text-muted-foreground">{refund.reason || '-'}</TableCell>
                  <TableCell>{getStatusBadge(refund.status)}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
