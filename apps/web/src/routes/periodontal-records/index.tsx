import { createFileRoute } from '@tanstack/react-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { cn } from '@danta/ui';

export const Route = createFileRoute('/periodontal-records/')({
  component: PeriodontalRecordsPage,
});

type PeriodontalRecord = {
  id: string;
  patient: { firstName: string; lastName: string };
  provider: { firstName: string; lastName: string };
  toothNumber: number;
  pocketDepth?: number;
  recession?: number;
  bleeding: boolean;
  plaque: boolean;
  notes?: string;
  chartDate: string;
};

export function PeriodontalRecordsPage() {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [patientId, setPatientId] = useState('');
  const [providerId, setProviderId] = useState('');
  const [toothNumber, setToothNumber] = useState('');
  const [pocketDepth, setPocketDepth] = useState('');
  const [recession, setRecession] = useState('');
  const [bleeding, setBleeding] = useState(false);
  const [plaque, setPlaque] = useState(false);
  const [notes, setNotes] = useState('');

  const { data: records, isLoading } = useQuery({
    queryKey: ['periodontal-records'],
    queryFn: async () => {
      const res = await fetch('/api/v1/periodontal-records');
      if (!res.ok) throw new Error('Failed to fetch periodontal records');
      return res.json() as Promise<PeriodontalRecord[]>;
    },
  });

  const { data: patients } = useQuery({
    queryKey: ['patients-list'],
    queryFn: async () => {
      const res = await fetch('/api/v1/patients');
      if (!res.ok) throw new Error('Failed to fetch patients');
      return res.json() as Promise<{ patients: { id: string; firstName: string; lastName: string }[] }>;
    },
  });

  const { data: providers } = useQuery({
    queryKey: ['providers-list'],
    queryFn: async () => {
      const res = await fetch('/api/v1/providers');
      if (!res.ok) throw new Error('Failed to fetch providers');
      return res.json() as Promise<{ id: string; firstName: string; lastName: string }[]>;
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await fetch('/api/v1/periodontal-records', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error('Failed to create periodontal record');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['periodontal-records'] });
      resetForm();
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const res = await fetch(`/api/v1/periodontal-records/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error('Failed to update periodontal record');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['periodontal-records'] });
      resetForm();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/v1/periodontal-records/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete periodontal record');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['periodontal-records'] });
    },
  });

  const resetForm = () => {
    setPatientId('');
    setProviderId('');
    setToothNumber('');
    setPocketDepth('');
    setRecession('');
    setBleeding(false);
    setPlaque(false);
    setNotes('');
    setShowForm(false);
    setEditingId(null);
  };

  const handleEdit = (r: PeriodontalRecord) => {
    setPatientId(r.patient.firstName + ' ' + r.patient.lastName);
    setProviderId(r.provider.firstName + ' ' + r.provider.lastName);
    setToothNumber(String(r.toothNumber));
    setPocketDepth(r.pocketDepth ? String(r.pocketDepth) : '');
    setRecession(r.recession ? String(r.recession) : '');
    setBleeding(r.bleeding);
    setPlaque(r.plaque);
    setNotes(r.notes || '');
    setEditingId(r.id);
    setShowForm(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const data = {
      patientId,
      providerId,
      toothNumber: Number(toothNumber),
      pocketDepth: pocketDepth ? Number(pocketDepth) : undefined,
      recession: recession ? Number(recession) : undefined,
      bleeding,
      plaque,
      notes: notes || undefined,
    };
    if (editingId) {
      updateMutation.mutate({ id: editingId, data });
    } else {
      createMutation.mutate(data);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Periodontal Records</h1>
          <p className="text-muted-foreground">Track periodontal measurements</p>
        </div>
        <button
          onClick={() => { resetForm(); setShowForm(true); }}
          className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium"
        >
          <Plus className="w-4 h-4" />
          New Record
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="border rounded-lg p-4 space-y-4">
          <h3 className="font-medium">{editingId ? 'Edit' : 'New'} Periodontal Record</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Patient</label>
              <select value={patientId} onChange={(e) => setPatientId(e.target.value)} className="w-full px-3 py-2 border rounded-md text-sm" required>
                <option value="">Select patient</option>
                {patients?.patients?.map((p) => (
                  <option key={p.id} value={p.id}>{p.firstName} {p.lastName}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Provider</label>
              <select value={providerId} onChange={(e) => setProviderId(e.target.value)} className="w-full px-3 py-2 border rounded-md text-sm" required>
                <option value="">Select provider</option>
                {providers?.map((p) => (
                  <option key={p.id} value={p.id}>{p.firstName} {p.lastName}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Tooth Number (1-85)</label>
              <input type="number" value={toothNumber} onChange={(e) => setToothNumber(e.target.value)} className="w-full px-3 py-2 border rounded-md text-sm" required min="1" max="85" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Pocket Depth (mm)</label>
              <input type="number" value={pocketDepth} onChange={(e) => setPocketDepth(e.target.value)} className="w-full px-3 py-2 border rounded-md text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Recession (mm)</label>
              <input type="number" value={recession} onChange={(e) => setRecession(e.target.value)} className="w-full px-3 py-2 border rounded-md text-sm" />
            </div>
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2">
                <input type="checkbox" checked={bleeding} onChange={(e) => setBleeding(e.target.checked)} className="rounded" />
                <span className="text-sm font-medium">Bleeding</span>
              </label>
              <label className="flex items-center gap-2">
                <input type="checkbox" checked={plaque} onChange={(e) => setPlaque(e.target.checked)} className="rounded" />
                <span className="text-sm font-medium">Plaque</span>
              </label>
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium mb-1">Notes</label>
              <textarea value={notes} onChange={(e) => setNotes(e.target.value)} className="w-full px-3 py-2 border rounded-md text-sm" rows={2} />
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
                <th className="text-left px-4 py-3 font-medium">Patient</th>
                <th className="text-left px-4 py-3 font-medium">Provider</th>
                <th className="text-left px-4 py-3 font-medium">Tooth</th>
                <th className="text-left px-4 py-3 font-medium">Pocket</th>
                <th className="text-left px-4 py-3 font-medium">Recession</th>
                <th className="text-left px-4 py-3 font-medium">Bleeding</th>
                <th className="text-left px-4 py-3 font-medium">Plaque</th>
                <th className="text-left px-4 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {records?.map((r) => (
                <tr key={r.id} className="hover:bg-muted/20">
                  <td className="px-4 py-3">{r.patient.firstName} {r.patient.lastName}</td>
                  <td className="px-4 py-3">{r.provider.firstName} {r.provider.lastName}</td>
                  <td className="px-4 py-3">{r.toothNumber}</td>
                  <td className="px-4 py-3">{r.pocketDepth ? `${r.pocketDepth}mm` : '-'}</td>
                  <td className="px-4 py-3">{r.recession ? `${r.recession}mm` : '-'}</td>
                  <td className="px-4 py-3">
                    <span className={cn('px-2 py-1 rounded-full text-xs font-medium', r.bleeding ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800')}>
                      {r.bleeding ? 'Yes' : 'No'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={cn('px-2 py-1 rounded-full text-xs font-medium', r.plaque ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800')}>
                      {r.plaque ? 'Yes' : 'No'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button onClick={() => handleEdit(r)} className="p-2 hover:bg-muted rounded"><Pencil className="w-4 h-4" /></button>
                      <button onClick={() => deleteMutation.mutate(r.id)} className="p-2 hover:bg-muted rounded text-red-600"><Trash2 className="w-4 h-4" /></button>
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
