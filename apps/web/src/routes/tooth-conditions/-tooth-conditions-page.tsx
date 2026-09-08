import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useState, useMemo } from 'react';
import { Plus, Search, Pencil, Trash2, GripVertical } from 'lucide-react';
import { Button } from '@danta/ui/button';
import { Input } from '@danta/ui/input';
import { Label } from '@danta/ui/label';
import { Badge } from '@danta/ui/badge';
import { Skeleton } from '@danta/ui/skeleton';
import { Select } from '@danta/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@danta/ui/dialog';
import { ConfirmationDialog } from '@danta/ui/confirmation-dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@danta/ui/table';
import { Tabs, TabsList, TabsTrigger } from '@danta/ui/tabs';
import { SURFACE_LABELS, type ToothSurface } from '@danta/schemas';
import {
  getToothConditionConfigs,
  createToothConditionConfig,
  updateToothConditionConfig,
  deleteToothConditionConfig,
} from '../../lib/api/tooth-condition-configs';
import type { ToothConditionConfig, CreateToothConditionConfig, UpdateToothConditionConfig } from '@danta/schemas';
import { toast } from 'sonner';

const CATEGORIES = ['general', 'diagnosis', 'restorative', 'endodontics', 'surgery', 'prosthodontics', 'orthodontics', 'preventive', 'periodontics', 'pediatric', 'trauma'];

const SURFACE_KEYS = Object.keys(SURFACE_LABELS) as ToothSurface[];

type FormData = {
  code: string;
  name: string;
  category: string;
  color: string;
  surfaces: ToothSurface[];
  cdtCode: string;
  cdtDescription: string;
  cdtFee: string;
  icon: string;
  order: string;
  active: boolean;
};

const EMPTY_FORM: FormData = {
  code: '',
  name: '',
  category: 'general',
  color: '#3b82f6',
  surfaces: [],
  cdtCode: '',
  cdtDescription: '',
  cdtFee: '',
  icon: '',
  order: '0',
  active: true,
};

function formToCreate(form: FormData): CreateToothConditionConfig {
  return {
    code: form.code,
    name: form.name,
    category: form.category,
    color: form.color,
    surfaces: form.surfaces,
    cdtCode: form.cdtCode || undefined,
    cdtDescription: form.cdtDescription || undefined,
    cdtFee: form.cdtFee ? Number(form.cdtFee) : undefined,
    icon: form.icon || undefined,
    order: Number(form.order) || 0,
    active: form.active,
    isSystem: false,
  };
}

function configToForm(c: ToothConditionConfig): FormData {
  return {
    code: c.code,
    name: c.name,
    category: c.category,
    color: c.color,
    surfaces: c.surfaces as ToothSurface[],
    cdtCode: c.cdtCode ?? '',
    cdtDescription: c.cdtDescription ?? '',
    cdtFee: cdtFeeString(c.cdtFee),
    icon: c.icon ?? '',
    order: String(c.order),
    active: c.active,
  };
}

function cdtFeeString(fee: number | null | undefined): string {
  if (fee == null) return '';
  return String(fee);
}

export function ToothConditionsPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<ToothConditionConfig | null>(null);
  const [form, setForm] = useState<FormData>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<ToothConditionConfig | null>(null);

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['tooth-condition-configs'],
    queryFn: () => getToothConditionConfigs(),
  });

  const configs = data ?? [];

  const filtered = useMemo(() => {
    return configs.filter((c) => {
      const matchesSearch = !search || c.name.toLowerCase().includes(search.toLowerCase()) || c.code.toLowerCase().includes(search.toLowerCase());
      const matchesCategory = categoryFilter === 'all' || c.category === categoryFilter;
      return matchesSearch && matchesCategory;
    });
  }, [configs, search, categoryFilter]);

  const categories = useMemo(() => Array.from(new Set(configs.map((c) => c.category))), [configs]);

  const openCreate = () => {
    setEditing(null);
    setForm(EMPTY_FORM);
    setDialogOpen(true);
  };

  const openEdit = (c: ToothConditionConfig) => {
    setEditing(c);
    setForm(configToForm(c));
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.code.trim() || !form.name.trim()) {
      toast.error('Code and name are required');
      return;
    }
    setSaving(true);
    try {
      if (editing) {
        const update: UpdateToothConditionConfig = {};
        if (form.name !== editing.name) update.name = form.name;
        if (form.category !== editing.category) update.category = form.category;
        if (form.color !== editing.color) update.color = form.color;
        if (JSON.stringify(form.surfaces) !== JSON.stringify(editing.surfaces)) update.surfaces = form.surfaces;
        if (form.cdtCode !== (editing.cdtCode ?? '')) update.cdtCode = form.cdtCode || null;
        if (form.cdtDescription !== (editing.cdtDescription ?? '')) update.cdtDescription = form.cdtDescription || null;
        if (form.cdtFee !== cdtFeeString(editing.cdtFee)) update.cdtFee = form.cdtFee ? Number(form.cdtFee) : null;
        if (form.icon !== (editing.icon ?? '')) update.icon = form.icon || null;
        if (Number(form.order) !== editing.order) update.order = Number(form.order);
        if (form.active !== editing.active) update.active = form.active;
        await updateToothConditionConfig(editing.id, update);
        toast.success('Condition updated');
      } else {
        await createToothConditionConfig(formToCreate(form));
        toast.success('Condition created');
      }
      queryClient.invalidateQueries({ queryKey: ['tooth-condition-configs'] });
      setDialogOpen(false);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to save';
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteToothConditionConfig(deleteTarget.id);
      toast.success('Condition deleted');
      queryClient.invalidateQueries({ queryKey: ['tooth-condition-configs'] });
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to delete';
      toast.error(msg);
    } finally {
      setDeleteTarget(null);
    }
  };

  const handleToggleActive = async (c: ToothConditionConfig) => {
    try {
      await updateToothConditionConfig(c.id, { active: !c.active });
      queryClient.invalidateQueries({ queryKey: ['tooth-condition-configs'] });
    } catch {
      toast.error('Failed to update');
    }
  };

  const toggleSurface = (s: ToothSurface) => {
    setForm((prev) => ({
      ...prev,
      surfaces: prev.surfaces.includes(s) ? prev.surfaces.filter((x) => x !== s) : [...prev.surfaces, s],
    }));
  };

  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Tooth Conditions</h1>
          <p className="text-muted-foreground">Manage configurable tooth conditions for the odontogram</p>
        </div>
        <div className="text-center py-12">
          <p className="text-destructive mb-4">Failed to load conditions</p>
          <Button onClick={() => refetch()} variant="outline">Retry</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Tooth Conditions</h1>
          <p className="text-muted-foreground">Manage configurable tooth conditions for the odontogram</p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="h-4 w-4 mr-2" />
          Add Condition
        </Button>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search by name or code…" value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Tabs value={categoryFilter} onValueChange={setCategoryFilter}>
          <TabsList className="flex-wrap h-auto gap-1">
            <TabsTrigger value="all" className="text-xs">All</TabsTrigger>
            {categories.map((c) => (
              <TabsTrigger key={c} value={c} className="text-xs capitalize">{c}</TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </div>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-8" />
              <TableHead>Name</TableHead>
              <TableHead>Code</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Surfaces</TableHead>
              <TableHead>CDT</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-24" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 6 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell><Skeleton className="h-4 w-4" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                  <TableCell><Skeleton className="h-6 w-16 rounded-full" /></TableCell>
                  <TableCell><Skeleton className="h-8 w-16" /></TableCell>
                </TableRow>
              ))
            ) : filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-12 text-muted-foreground">
                  No conditions found
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((c) => (
                <TableRow key={c.id} className={!c.active ? 'opacity-60' : undefined}>
                  <TableCell>
                    <GripVertical className="h-4 w-4 text-muted-foreground" />
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span className="inline-block h-4 w-4 rounded-sm border" style={{ backgroundColor: c.color }} />
                      <span className="font-medium">{c.name}</span>
                      {c.isSystem && <Badge variant="secondary" className="text-[10px]">system</Badge>}
                    </div>
                  </TableCell>
                  <TableCell className="font-mono text-sm">{c.code}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="capitalize text-xs">{c.category}</Badge>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {c.surfaces.length > 0 ? c.surfaces.map((s) => SURFACE_LABELS[s as ToothSurface] ?? s).join(', ') : '—'}
                  </TableCell>
                  <TableCell className="text-xs">
                    {c.cdtCode ? (
                      <span className="font-mono">{c.cdtCode}{c.cdtFee != null ? ` · $${c.cdtFee}` : ''}</span>
                    ) : '—'}
                  </TableCell>
                  <TableCell>
                    <button
                      type="button"
                      onClick={() => handleToggleActive(c)}
                      className="inline-flex items-center"
                    >
                      <Badge variant={c.active ? 'default' : 'secondary'} className="cursor-pointer">
                        {c.active ? 'Active' : 'Inactive'}
                      </Badge>
                    </button>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(c)} aria-label="Edit">
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setDeleteTarget(c)} aria-label="Delete" disabled={c.isSystem}>
                        <Trash2 className="h-3.5 w-3.5 text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? 'Edit Condition' : 'Add Condition'}</DialogTitle>
            <DialogDescription>
              {editing ? 'Update the condition details.' : 'Create a new tooth condition for the odontogram.'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Code *</Label>
                <Input value={form.code} onChange={(e) => setForm((p) => ({ ...p, code: e.target.value }))} placeholder="e.g. caries" disabled={editing?.isSystem} />
              </div>
              <div className="space-y-1.5">
                <Label>Name *</Label>
                <Input value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} placeholder="e.g. Caries" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Category</Label>
                <Select value={form.category} onChange={(e) => setForm((p) => ({ ...p, category: e.target.value }))}>
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c} className="capitalize">{c}</option>
                  ))}
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Color</Label>
                <div className="flex items-center gap-2">
                  <Input type="color" value={form.color} onChange={(e) => setForm((p) => ({ ...p, color: e.target.value }))} className="w-12 h-10 p-1" />
                  <Input value={form.color} onChange={(e) => setForm((p) => ({ ...p, color: e.target.value }))} placeholder="#3b82f6" />
                </div>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Applicable Surfaces</Label>
              <div className="flex flex-wrap gap-1.5">
                {SURFACE_KEYS.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => toggleSurface(s)}
                    className={`rounded-full px-3 py-1 text-xs font-medium border transition-colors ${
                      form.surfaces.includes(s)
                        ? 'bg-primary text-primary-foreground border-primary'
                        : 'bg-background text-muted-foreground hover:bg-muted'
                    }`}
                  >
                    {SURFACE_LABELS[s]}
                  </button>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>CDT Code</Label>
                <Input value={form.cdtCode} onChange={(e) => setForm((p) => ({ ...p, cdtCode: e.target.value }))} placeholder="e.g. D2392" />
              </div>
              <div className="space-y-1.5">
                <Label>CDT Fee</Label>
                <Input type="number" min="0" step="0.01" value={form.cdtFee} onChange={(e) => setForm((p) => ({ ...p, cdtFee: e.target.value }))} placeholder="0.00" />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>CDT Description</Label>
              <Input value={form.cdtDescription} onChange={(e) => setForm((p) => ({ ...p, cdtDescription: e.target.value }))} placeholder="e.g. Composite restoration — two surfaces" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Display Order</Label>
                <Input type="number" value={form.order} onChange={(e) => setForm((p) => ({ ...p, order: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <Label>Icon (optional)</Label>
                <Input value={form.icon} onChange={(e) => setForm((p) => ({ ...p, icon: e.target.value }))} placeholder="lucide icon name" />
              </div>
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={form.active} onChange={(e) => setForm((p) => ({ ...p, active: e.target.checked }))} className="h-4 w-4 rounded border" />
              Active
            </label>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving}>{saving ? 'Saving…' : editing ? 'Update' : 'Create'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmationDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="Delete condition"
        description={`Are you sure you want to delete "${deleteTarget?.name ?? ''}"? This cannot be undone.`}
        confirmText="Delete"
        onConfirm={handleDelete}
      />
    </div>
  );
}
