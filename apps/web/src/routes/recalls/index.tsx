import { createFileRoute } from '@tanstack/react-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState, useEffect } from 'react';
import { Plus, Pencil } from 'lucide-react';
import { cn } from '@danta/ui';

export const Route = createFileRoute('/recalls/')({
  component: RecallsPage,
});

type Recall = {
  id: string;
  patientId: string;
  patient: { id: string; firstName: string; lastName: string };
  type: string;
  status: string;
  dueDate: string;
  notes?: string;
  contactCount: number;
};

type PatientOption = {
  id: string;
  firstName: string;
  lastName: string;
};

export function RecallsPage() {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [patientId, setPatientId] = useState('');
  const [type, setType] = useState('examination');
  const [dueDate, setDueDate] = useState('');
  const [notes, setNotes] = useState('');
  const [patients, setPatients] = useState<PatientOption[]>([]);

  useEffect(() => {
    fetch('/api/v1/patients')
      .then((res) => res.json())
      .then((data) => setPatients(data as PatientOption[]))
      .catch(() => {});
  }, []);

  const { data: recalls, isLoading } = useQuery({
    queryKey: ['recalls'],
    queryFn: async () => {
      const res = await fetch('/api/v1/recalls');
      if (!res.ok) throw new Error('Failed to fetch recalls');
      return res.json() as Promise<Recall[]>;
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: { patientId: string; type: string; dueDate: string; notes?: string }) => {
      const res = await fetch('/api/v1/recalls', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error('Failed to create recall');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recalls'] });
      resetForm();
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: { type?: string; status?: string; dueDate?: string; notes?: string; bookedAt?: string; completedAt?: string } }) => {
      const res = await fetch(`/api/v1/recalls/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error('Failed to update recall');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recalls'] });
      resetForm();
    },
  });

  const resetForm = () => {
    setPatientId('');
    setType('examination');
    setDueDate('');
    setNotes('');
    setShowForm(false);
    setEditingId(null);
  };

  const handleEdit = (r: Recall) => {
    setPatientId(r.patientId);
    setType(r.type);
    setDueDate(r.dueDate.split('T')[0]);
    setNotes(r.notes || '');
    setEditingId(r.id);
    setShowForm(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const data = { patientId, type, dueDate, notes: notes || undefined };
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
          <h1 className="text-2xl font-bold">Recalls</h1>
          <p className="text-muted-foreground">Manage patient recall reminders</p>
        </div>
        <button
          onClick={() => { resetForm(); setShowForm(true); }}
          className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium"
        >
          <Plus className="w-4 h-4" />
          New Recall
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="border rounded-lg p-4 space-y-4">
          <h3 className="font-medium">{editingId ? 'Edit' : 'New'} Recall</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Patient</label>
              <select value={patientId} onChange={(e) => setPatientId(e.target.value)} className="w-full px-3 py-2 border rounded-md text-sm" required>
                <option value="">Select patient</option>
                {patients?.map((p) => (
                  <option key={p.id} value={p.id}>{p.firstName} {p.lastName}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Type</label>
              <select value={type} onChange={(e) => setType(e.target.value)} className="w-full px-3 py-2 border rounded-md text-sm">
                <option value="examination">Examination</option>
                <option value="hygiene">Hygiene</option>
                <option value="periodontal">Periodontal</option>
                <option value="xray">X-Ray</option>
                <option value="treatment_followup">Treatment Follow-up</option>
                <option value="custom">Custom</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Due Date</label>
              <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} className="w-full px-3 py-2 border rounded-md text-sm" required />
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
                <th className="text-left px-4 py-3 font-medium">Type</th>
                <th className="text-left px-4 py-3 font-medium">Due Date</th>
                <th className="text-left px-4 py-3 font-medium">Status</th>
                <th className="text-left px-4 py-3 font-medium">Contacts</th>
                <th className="text-left px-4 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {recalls?.map((r) => (
                <tr key={r.id} className="hover:bg-muted/20">
                  <td className="px-4 py-3">{r.patient.firstName} {r.patient.lastName}</td>
                  <td className="px-4 py-3 capitalize">{r.type.replace('_', ' ')}</td>
                  <td className="px-4 py-3">{new Date(r.dueDate).toLocaleDateString()}</td>
                  <td className="px-4 py-3">
                    <span className={cn('px-2 py-1 rounded-full text-xs font-medium', r.status === 'completed' ? 'bg-green-100 text-green-800' : r.status === 'overdue' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800')}>
                      {r.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">{r.contactCount}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button onClick={() => handleEdit(r)} className="p-2 hover:bg-muted rounded"><Pencil className="w-4 h-4" /></button>
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
