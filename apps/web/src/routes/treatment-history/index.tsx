import { createFileRoute } from '@tanstack/react-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { cn } from '@danta/ui';

export const Route = createFileRoute('/treatment-history/')({
  component: TreatmentHistoryPage,
});

type TreatmentHistoryItem = {
  id: string;
  patient: { id: string; firstName: string; lastName: string };
  provider: { id: string; firstName: string; lastName: string };
  treatment: string;
  description?: string;
  cost?: number;
  date: string;
  status: string;
};

export function TreatmentHistoryPage() {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [patientId, setPatientId] = useState('');
  const [providerId, setProviderId] = useState('');
  const [treatment, setTreatment] = useState('');
  const [description, setDescription] = useState('');
  const [cost, setCost] = useState('');
  const [date, setDate] = useState('');
  const [status, setStatus] = useState('completed');

  const { data: history, isLoading } = useQuery({
    queryKey: ['treatment-history'],
    queryFn: async () => {
      const res = await fetch('/api/v1/treatment-history');
      if (!res.ok) throw new Error('Failed to fetch treatment history');
      return res.json() as Promise<TreatmentHistoryItem[]>;
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
      const res = await fetch('/api/v1/treatment-history', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error('Failed to create treatment history');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['treatment-history'] });
      resetForm();
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const res = await fetch(`/api/v1/treatment-history/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error('Failed to update treatment history');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['treatment-history'] });
      resetForm();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/v1/treatment-history/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete treatment history');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['treatment-history'] });
    },
  });

  const resetForm = () => {
    setPatientId('');
    setProviderId('');
    setTreatment('');
    setDescription('');
    setCost('');
    setDate('');
    setStatus('completed');
    setShowForm(false);
    setEditingId(null);
  };

  const handleEdit = (h: TreatmentHistoryItem) => {
    setPatientId(h.patient.id);
    setProviderId(h.provider.id);
    setTreatment(h.treatment);
    setDescription(h.description || '');
    setCost(h.cost ? String(h.cost) : '');
    setDate(h.date.split('T')[0]);
    setStatus(h.status);
    setEditingId(h.id);
    setShowForm(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const data = { patientId, providerId, treatment, description: description || undefined, cost: cost ? Number(cost) : undefined, date, status };
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
          <h1 className="text-2xl font-bold">Treatment History</h1>
          <p className="text-muted-foreground">Track completed treatments</p>
        </div>
        <button
          onClick={() => { resetForm(); setShowForm(true); }}
          className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium"
        >
          <Plus className="w-4 h-4" />
          New Entry
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="border rounded-lg p-4 space-y-4">
          <h3 className="font-medium">{editingId ? 'Edit' : 'New'} Treatment History</h3>
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
              <label className="block text-sm font-medium mb-1">Treatment</label>
              <input value={treatment} onChange={(e) => setTreatment(e.target.value)} className="w-full px-3 py-2 border rounded-md text-sm" required />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Date</label>
              <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="w-full px-3 py-2 border rounded-md text-sm" required />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Cost</label>
              <input type="number" value={cost} onChange={(e) => setCost(e.target.value)} className="w-full px-3 py-2 border rounded-md text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Status</label>
              <select value={status} onChange={(e) => setStatus(e.target.value)} className="w-full px-3 py-2 border rounded-md text-sm">
                <option value="completed">Completed</option>
                <option value="planned">Planned</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium mb-1">Description</label>
              <textarea value={description} onChange={(e) => setDescription(e.target.value)} className="w-full px-3 py-2 border rounded-md text-sm" rows={2} />
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
                <th className="text-left px-4 py-3 font-medium">Treatment</th>
                <th className="text-left px-4 py-3 font-medium">Date</th>
                <th className="text-left px-4 py-3 font-medium">Cost</th>
                <th className="text-left px-4 py-3 font-medium">Status</th>
                <th className="text-left px-4 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {history?.map((h) => (
                <tr key={h.id} className="hover:bg-muted/20">
                  <td className="px-4 py-3">{h.patient.firstName} {h.patient.lastName}</td>
                  <td className="px-4 py-3">{h.provider.firstName} {h.provider.lastName}</td>
                  <td className="px-4 py-3">{h.treatment}</td>
                  <td className="px-4 py-3">{new Date(h.date).toLocaleDateString()}</td>
                  <td className="px-4 py-3">{h.cost ? `$${h.cost.toFixed(2)}` : '-'}</td>
                  <td className="px-4 py-3">
                    <span className={cn('px-2 py-1 rounded-full text-xs font-medium', h.status === 'completed' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800')}>
                      {h.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button onClick={() => handleEdit(h)} className="p-2 hover:bg-muted rounded"><Pencil className="w-4 h-4" /></button>
                      <button onClick={() => deleteMutation.mutate(h.id)} className="p-2 hover:bg-muted rounded text-red-600"><Trash2 className="w-4 h-4" /></button>
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
