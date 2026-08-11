import { createFileRoute } from '@tanstack/react-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { cn } from '@danta/ui';

export const Route = createFileRoute('/tooth-conditions/')({
  component: ToothConditionsPage,
});

type ToothCondition = {
  id: string;
  dentalChartId: string;
  toothNumber: number;
  condition: string;
  surface?: string;
  status: string;
  notes?: string;
};

export function ToothConditionsPage() {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [dentalChartId, setDentalChartId] = useState('');
  const [toothNumber, setToothNumber] = useState('');
  const [condition, setCondition] = useState('');
  const [surface, setSurface] = useState('');
  const [status, setStatus] = useState('active');
  const [notes, setNotes] = useState('');

  const { data: conditions, isLoading } = useQuery({
    queryKey: ['tooth-conditions'],
    queryFn: async () => {
      const res = await fetch('/api/v1/tooth-conditions');
      if (!res.ok) throw new Error('Failed to fetch tooth conditions');
      return res.json() as Promise<ToothCondition[]>;
    },
  });

  const { data: charts } = useQuery({
    queryKey: ['dental-charts-list'],
    queryFn: async () => {
      const res = await fetch('/api/v1/dental-charts');
      if (!res.ok) throw new Error('Failed to fetch dental charts');
      return res.json() as Promise<{ id: string; patient: { firstName: string; lastName: string } }[]>;
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await fetch('/api/v1/tooth-conditions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error('Failed to create tooth condition');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tooth-conditions'] });
      resetForm();
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const res = await fetch(`/api/v1/tooth-conditions/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error('Failed to update tooth condition');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tooth-conditions'] });
      resetForm();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/v1/tooth-conditions/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete tooth condition');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tooth-conditions'] });
    },
  });

  const resetForm = () => {
    setDentalChartId('');
    setToothNumber('');
    setCondition('');
    setSurface('');
    setStatus('active');
    setNotes('');
    setShowForm(false);
    setEditingId(null);
  };

  const handleEdit = (c: ToothCondition) => {
    setDentalChartId(c.dentalChartId);
    setToothNumber(String(c.toothNumber));
    setCondition(c.condition);
    setSurface(c.surface || '');
    setStatus(c.status);
    setNotes(c.notes || '');
    setEditingId(c.id);
    setShowForm(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const data = { dentalChartId, toothNumber: Number(toothNumber), condition, surface: surface || undefined, status, notes: notes || undefined };
    if (editingId) {
      updateMutation.mutate({ id: editingId, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const getChartLabel = (cid: string) => {
    const c = charts?.find((ch) => ch.id === cid);
    return c ? `Chart ${c.id.slice(0, 8)}` : 'Unknown';
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Tooth Conditions</h1>
          <p className="text-muted-foreground">Manage tooth conditions and diagnoses</p>
        </div>
        <button
          onClick={() => { resetForm(); setShowForm(true); }}
          className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium"
        >
          <Plus className="w-4 h-4" />
          New Condition
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="border rounded-lg p-4 space-y-4">
          <h3 className="font-medium">{editingId ? 'Edit' : 'New'} Tooth Condition</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Dental Chart</label>
              <select value={dentalChartId} onChange={(e) => setDentalChartId(e.target.value)} className="w-full px-3 py-2 border rounded-md text-sm" required>
                <option value="">Select chart</option>
                {charts?.map((c) => (
                  <option key={c.id} value={c.id}>{getChartLabel(c.id)}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Tooth Number (1-85)</label>
              <input type="number" value={toothNumber} onChange={(e) => setToothNumber(e.target.value)} className="w-full px-3 py-2 border rounded-md text-sm" required min="1" max="85" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Condition</label>
              <input value={condition} onChange={(e) => setCondition(e.target.value)} className="w-full px-3 py-2 border rounded-md text-sm" required />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Surface</label>
              <input value={surface} onChange={(e) => setSurface(e.target.value)} className="w-full px-3 py-2 border rounded-md text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Status</label>
              <select value={status} onChange={(e) => setStatus(e.target.value)} className="w-full px-3 py-2 border rounded-md text-sm">
                <option value="active">Active</option>
                <option value="treated">Treated</option>
                <option value="extracted">Extracted</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Notes</label>
              <input value={notes} onChange={(e) => setNotes(e.target.value)} className="w-full px-3 py-2 border rounded-md text-sm" />
            </div>
          </div>
          <div className="flex gap-2">
            <button type="submit" className="px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm">{editingId ? 'Update' : 'Create'}</button>
            <button type="button" onClick={resetForm} className="px-4 py-2 border rounded-md text-sm">Cancel</button>
          </div>
        </form>
      )}

      {isLoading ? (
        <div className="text-center py-12 text-muted-foreground">Loading...</div>
      ) : (
        <div className="border rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/40">
              <tr>
                <th className="text-left px-4 py-3 font-medium">Chart</th>
                <th className="text-left px-4 py-3 font-medium">Tooth</th>
                <th className="text-left px-4 py-3 font-medium">Condition</th>
                <th className="text-left px-4 py-3 font-medium">Surface</th>
                <th className="text-left px-4 py-3 font-medium">Status</th>
                <th className="text-left px-4 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {conditions?.map((c) => (
                <tr key={c.id} className="hover:bg-muted/20">
                  <td className="px-4 py-3">{getChartLabel(c.id)}</td>
                  <td className="px-4 py-3">{c.toothNumber}</td>
                  <td className="px-4 py-3">{c.condition}</td>
                  <td className="px-4 py-3">{c.surface || '-'}</td>
                  <td className="px-4 py-3">
                    <span className={cn('px-2 py-1 rounded-full text-xs font-medium', c.status === 'active' ? 'bg-yellow-100 text-yellow-800' : c.status === 'treated' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800')}>
                      {c.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button onClick={() => handleEdit(c)} className="p-2 hover:bg-muted rounded"><Pencil className="w-4 h-4" /></button>
                      <button onClick={() => deleteMutation.mutate(c.id)} className="p-2 hover:bg-muted rounded text-red-600"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
