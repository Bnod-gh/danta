import { createFileRoute } from '@tanstack/react-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState, useEffect } from 'react';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { cn } from '@danta/ui';

export const Route = createFileRoute('/fees/')({
  component: FeesPage,
});

type FeeScheduleItem = {
  id: string;
  serviceId: string;
  service: { id: string; name: string };
  amount: number;
  currency: string;
  effectiveFrom: string;
  effectiveTo?: string;
  isActive: boolean;
};

type ServiceOption = {
  id: string;
  name: string;
};

export function FeesPage() {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [serviceId, setServiceId] = useState('');
  const [amount, setAmount] = useState('');
  const [currency, setCurrency] = useState('AUD');
  const [effectiveFrom, setEffectiveFrom] = useState('');
  const [effectiveTo, setEffectiveTo] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [services, setServices] = useState<ServiceOption[]>([]);

  useEffect(() => {
    fetch('/api/v1/services')
      .then((res) => res.json())
      .then((data: ServiceOption[]) => setServices(data))
      .catch(() => {});
  }, []);

  const { data: fees, isLoading } = useQuery({
    queryKey: ['fees'],
    queryFn: async () => {
      const res = await fetch('/api/v1/fees');
      if (!res.ok) throw new Error('Failed to fetch fees');
      return res.json() as Promise<FeeScheduleItem[]>;
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await fetch('/api/v1/fees', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error('Failed to create fee schedule');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fees'] });
      resetForm();
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const res = await fetch(`/api/v1/fees/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error('Failed to update fee schedule');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fees'] });
      resetForm();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/v1/fees/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete fee schedule');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fees'] });
    },
  });

  const resetForm = () => {
    setServiceId('');
    setAmount('');
    setCurrency('AUD');
    setEffectiveFrom('');
    setEffectiveTo('');
    setIsActive(true);
    setShowForm(false);
    setEditingId(null);
  };

  const handleEdit = (f: FeeScheduleItem) => {
    setServiceId(f.serviceId);
    setAmount(String(f.amount));
    setCurrency(f.currency);
    setEffectiveFrom(f.effectiveFrom.split('T')[0]);
    setEffectiveTo(f.effectiveTo ? f.effectiveTo.split('T')[0] : '');
    setIsActive(f.isActive);
    setEditingId(f.id);
    setShowForm(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const data = {
      serviceId,
      amount: Number(amount),
      currency,
      effectiveFrom,
      effectiveTo: effectiveTo || undefined,
      isActive,
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
          <h1 className="text-2xl font-bold">Fee Schedules</h1>
          <p className="text-muted-foreground">Manage service pricing</p>
        </div>
        <button
          onClick={() => { resetForm(); setShowForm(true); }}
          className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium"
        >
          <Plus className="w-4 h-4" />
          New Fee
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="border rounded-lg p-4 space-y-4">
          <h3 className="font-medium">{editingId ? 'Edit' : 'New'} Fee Schedule</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Service</label>
              <select value={serviceId} onChange={(e) => setServiceId(e.target.value)} className="w-full px-3 py-2 border rounded-md text-sm" required>
                <option value="">Select service</option>
                {services?.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Amount</label>
              <input type="number" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} className="w-full px-3 py-2 border rounded-md text-sm" required />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Currency</label>
              <select value={currency} onChange={(e) => setCurrency(e.target.value)} className="w-full px-3 py-2 border rounded-md text-sm">
                <option value="AUD">AUD</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Active</label>
              <select value={isActive ? 'true' : 'false'} onChange={(e) => setIsActive(e.target.value === 'true')} className="w-full px-3 py-2 border rounded-md text-sm">
                <option value="true">Yes</option>
                <option value="false">No</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Effective From</label>
              <input type="date" value={effectiveFrom} onChange={(e) => setEffectiveFrom(e.target.value)} className="w-full px-3 py-2 border rounded-md text-sm" required />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Effective To</label>
              <input type="date" value={effectiveTo} onChange={(e) => setEffectiveTo(e.target.value)} className="w-full px-3 py-2 border rounded-md text-sm" />
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
                <th className="text-left px-4 py-3 font-medium">Service</th>
                <th className="text-left px-4 py-3 font-medium">Amount</th>
                <th className="text-left px-4 py-3 font-medium">Effective From</th>
                <th className="text-left px-4 py-3 font-medium">Effective To</th>
                <th className="text-left px-4 py-3 font-medium">Active</th>
                <th className="text-left px-4 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {fees?.map((f) => (
                <tr key={f.id} className="hover:bg-muted/20">
                  <td className="px-4 py-3">{f.service.name}</td>
                  <td className="px-4 py-3">${f.amount.toFixed(2)} {f.currency}</td>
                  <td className="px-4 py-3">{new Date(f.effectiveFrom).toLocaleDateString()}</td>
                  <td className="px-4 py-3">{f.effectiveTo ? new Date(f.effectiveTo).toLocaleDateString() : '-'}</td>
                  <td className="px-4 py-3">
                    <span className={cn('px-2 py-1 rounded-full text-xs font-medium', f.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800')}>
                      {f.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button onClick={() => handleEdit(f)} className="p-2 hover:bg-muted rounded"><Pencil className="w-4 h-4" /></button>
                      <button onClick={() => deleteMutation.mutate(f.id)} className="p-2 hover:bg-muted rounded text-red-600"><Trash2 className="w-4 h-4" /></button>
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
