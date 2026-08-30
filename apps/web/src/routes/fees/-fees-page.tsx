import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { Plus, Search } from 'lucide-react';
import { Button } from '@danta/ui/button';
import { Input } from '@danta/ui/input';
import { Label } from '@danta/ui/label';
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
import { apiGet, apiPost } from '../../lib/api/request';
import type { FeeSchedule, Service } from '@danta/schemas';
import { formatCurrency } from '../../lib/format';
import { toast } from 'sonner';

type FeeRow = FeeSchedule & { service: Service };

export function FeesPage() {
  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [serviceId, setServiceId] = useState('');
  const [amount, setAmount] = useState('');
  const [saving, setSaving] = useState(false);
  const queryClient = useQueryClient();

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['fees', search],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      return apiGet<FeeRow[]>(`/fees?${params.toString()}`);
    },
  });

  const servicesQuery = useQuery({
    queryKey: ['services', 'for-fees'],
    queryFn: () => apiGet<Service[]>('/services'),
    enabled: dialogOpen,
  });

  const handleCreate = async () => {
    const parsed = Number(amount);
    if (!serviceId || !Number.isFinite(parsed) || parsed <= 0) {
      toast.error('Select a service and enter a positive amount');
      return;
    }
    setSaving(true);
    try {
      await apiPost('/fees', {
        serviceId,
        amount: parsed,
        currency: 'AUD',
        effectiveFrom: new Date().toISOString(),
      });
      toast.success('Fee schedule entry created');
      setDialogOpen(false);
      setServiceId('');
      setAmount('');
      await queryClient.invalidateQueries({ queryKey: ['fees'] });
    } catch {
      toast.error('Failed to create fee schedule entry');
    } finally {
      setSaving(false);
    }
  };

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Fee Schedule</h1>
            <p className="text-muted-foreground">Manage fee schedule</p>
          </div>
        </div>
        <div className="text-center py-12">
          <p className="text-destructive mb-4">Failed to load fees</p>
          <Button onClick={() => refetch()} variant="outline">Retry</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Fee Schedule</h1>
          <p className="text-muted-foreground">Manage fee schedule</p>
        </div>
        <Button onClick={() => setDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Fee
        </Button>
      </div>

      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search fees..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Service</TableHead>
              <TableHead>Code</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Fee (AUD)</TableHead>
              <TableHead>Effective From</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell><Skeleton className="h-4 w-40" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                  <TableCell><Skeleton className="h-6 w-16 rounded-full" /></TableCell>
                </TableRow>
              ))
            ) : data?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-12 text-muted-foreground">
                  No fees found
                </TableCell>
              </TableRow>
            ) : (
              data?.map((fee) => (
                <TableRow key={fee.id}>
                  <TableCell className="font-medium">{fee.service.name}</TableCell>
                  <TableCell>{fee.service.code ? <span className="font-mono text-sm">{fee.service.code}</span> : <span className="text-muted-foreground">—</span>}</TableCell>
                  <TableCell className="text-muted-foreground">{fee.service.category ?? '—'}</TableCell>
                  <TableCell>{formatCurrency(Number(fee.amount))}</TableCell>
                  <TableCell className="text-muted-foreground">{new Date(fee.effectiveFrom).toLocaleDateString()}</TableCell>
                  <TableCell>
                    <Badge variant={fee.isActive ? 'default' : 'secondary'}>
                      {fee.isActive ? 'Active' : 'Inactive'}
                    </Badge>
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
            <DialogTitle>Add Fee Schedule Entry</DialogTitle>
            <DialogDescription>Attach a fee to a service. Codes come from the service definition.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="fee-service">Service</Label>
              <Select id="fee-service" value={serviceId} onChange={(e) => setServiceId(e.target.value)}>
                <option value="">Select a service…</option>
                {(servicesQuery.data ?? []).map((service) => (
                  <option key={service.id} value={service.id}>
                    {service.name}{service.code ? ` (${service.code})` : ''}
                  </option>
                ))}
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="fee-amount">Amount (AUD)</Label>
              <Input id="fee-amount" type="number" min={0.01} step={0.01} value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="180.00" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={saving}>Cancel</Button>
            <Button onClick={handleCreate} disabled={saving}>{saving ? 'Saving…' : 'Create Fee'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
