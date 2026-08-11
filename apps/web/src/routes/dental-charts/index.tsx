import { createFileRoute } from '@tanstack/react-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { Plus, Pencil, Trash2 } from 'lucide-react';

export const Route = createFileRoute('/dental-charts/')({
  component: DentalChartsPage,
});

type DentalChart = {
  id: string;
  patient: { id: string; firstName: string; lastName: string };
  chartDate: string;
  notes?: string;
};

export function DentalChartsPage() {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [patientId, setPatientId] = useState('');
  const [notes, setNotes] = useState('');

  const { data: charts, isLoading } = useQuery({
    queryKey: ['dental-charts'],
    queryFn: async () => {
      const res = await fetch('/api/v1/dental-charts');
      if (!res.ok) throw new Error('Failed to fetch dental charts');
      return res.json() as Promise<DentalChart[]>;
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

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await fetch('/api/v1/dental-charts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error('Failed to create dental chart');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dental-charts'] });
      resetForm();
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const res = await fetch(`/api/v1/dental-charts/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error('Failed to update dental chart');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dental-charts'] });
      resetForm();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/v1/dental-charts/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete dental chart');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dental-charts'] });
    },
  });

  const resetForm = () => {
    setPatientId('');
    setNotes('');
    setShowForm(false);
    setEditingId(null);
  };

  const handleEdit = (chart: DentalChart) => {
    setPatientId(chart.patient.id);
    setNotes(chart.notes || '');
    setEditingId(chart.id);
    setShowForm(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const data = { patientId, notes: notes || undefined };
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
          <h1 className="text-2xl font-bold">Dental Charts</h1>
          <p className="text-muted-foreground">Manage dental chart records</p>
        </div>
        <button
          onClick={() => { resetForm(); setShowForm(true); }}
          className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium"
        >
          <Plus className="w-4 h-4" />
          New Chart
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="border rounded-lg p-4 space-y-4">
          <h3 className="font-medium">{editingId ? 'Edit' : 'New'} Dental Chart</h3>
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
                <th className="text-left px-4 py-3 font-medium">Chart Date</th>
                <th className="text-left px-4 py-3 font-medium">Notes</th>
                <th className="text-left px-4 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {charts?.map((chart) => (
                <tr key={chart.id} className="hover:bg-muted/20">
                  <td className="px-4 py-3">{chart.patient.firstName} {chart.patient.lastName}</td>
                  <td className="px-4 py-3">{new Date(chart.chartDate).toLocaleDateString()}</td>
                  <td className="px-4 py-3 max-w-xs truncate">{chart.notes || '-'}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button onClick={() => handleEdit(chart)} className="p-2 hover:bg-muted rounded"><Pencil className="w-4 h-4" /></button>
                      <button onClick={() => deleteMutation.mutate(chart.id)} className="p-2 hover:bg-muted rounded text-red-600"><Trash2 className="w-4 h-4" /></button>
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
