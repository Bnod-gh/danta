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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@danta/ui/table';
import { apiGet, apiPost } from '../../lib/api/request';
import type { AppointmentType } from '@danta/schemas';
import { toast } from 'sonner';

type AppointmentTypeView = AppointmentType;

const EMPTY_FORM = { name: '', code: '', duration: '30', description: '' };

export function AppointmentTypesPage() {
  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const queryClient = useQueryClient();

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['appointment-types', search],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      return apiGet<AppointmentTypeView[]>(`/appointment-types?${params.toString()}`);
    },
  });

  const handleCreate = async () => {
    if (!form.name.trim()) {
      toast.error('Name is required');
      return;
    }
    setSaving(true);
    try {
      await apiPost('/appointment-types', {
        name: form.name.trim(),
        ...(form.code.trim() ? { code: form.code.trim().toUpperCase() } : {}),
        duration: Number(form.duration) || 30,
        ...(form.description.trim() ? { description: form.description.trim() } : {}),
      });
      toast.success('Appointment type created');
      setDialogOpen(false);
      setForm(EMPTY_FORM);
      await queryClient.invalidateQueries({ queryKey: ['appointment-types'] });
    } catch {
      toast.error('Failed to create appointment type');
    } finally {
      setSaving(false);
    }
  };

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Appointment Types</h1>
            <p className="text-muted-foreground">Manage appointment types</p>
          </div>
        </div>
        <div className="text-center py-12">
          <p className="text-destructive mb-4">Failed to load appointment types</p>
          <Button onClick={() => refetch()} variant="outline">Retry</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Appointment Types</h1>
          <p className="text-muted-foreground">Manage appointment types</p>
        </div>
        <Button onClick={() => setDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Type
        </Button>
      </div>

      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search types..."
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
              <TableHead>Name</TableHead>
              <TableHead>Code</TableHead>
              <TableHead>Duration</TableHead>
              <TableHead>Color</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                  <TableCell><Skeleton className="h-6 w-16 rounded-full" /></TableCell>
                </TableRow>
              ))
            ) : data?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-12 text-muted-foreground">
                  No appointment types found
                </TableCell>
              </TableRow>
            ) : (
              data?.map((type) => (
                <TableRow key={type.id}>
                  <TableCell>
                    <div>
                      <p className="font-medium">{type.name}</p>
                      {type.description && <p className="text-xs text-muted-foreground line-clamp-1">{type.description}</p>}
                    </div>
                  </TableCell>
                  <TableCell>{type.code ? <span className="font-mono text-sm">{type.code}</span> : <span className="text-muted-foreground">—</span>}</TableCell>
                  <TableCell>{type.duration} min</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className="h-4 w-4 rounded-full" style={{ backgroundColor: type.color }} />
                      {type.color}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={type.isActive ? 'default' : 'secondary'}>
                      {type.isActive ? 'Active' : 'Inactive'}
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
            <DialogTitle>Add Appointment Type</DialogTitle>
            <DialogDescription>Create a new appointment type. Codes follow your clinical coding standard (e.g. D1110).</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="appt-type-name">Name</Label>
              <Input id="appt-type-name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Prophylaxis (Clean)" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="appt-type-code">Code</Label>
                <Input id="appt-type-code" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} placeholder="D1110" className="font-mono" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="appt-type-duration">Duration (min)</Label>
                <Input id="appt-type-duration" type="number" min={5} step={5} value={form.duration} onChange={(e) => setForm({ ...form, duration: e.target.value })} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="appt-type-description">Description</Label>
              <Input id="appt-type-description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Optional notes" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={saving}>Cancel</Button>
            <Button onClick={handleCreate} disabled={saving}>{saving ? 'Saving…' : 'Create Type'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
