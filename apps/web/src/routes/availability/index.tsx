import { createFileRoute } from '@tanstack/react-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { Plus, Pencil, Trash2 } from 'lucide-react';

export const Route = createFileRoute('/availability/')({
  component: AvailabilityPage,
});

type AvailabilitySlot = {
  id: string;
  providerId: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
};

type ProviderOption = {
  id: string;
  firstName: string;
  lastName: string;
};

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export function AvailabilityPage() {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [providerId, setProviderId] = useState('');
  const [dayOfWeek, setDayOfWeek] = useState('1');
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('17:00');

  const { data: slots, isLoading } = useQuery({
    queryKey: ['availability'],
    queryFn: async () => {
      const res = await fetch('/api/v1/availability');
      if (!res.ok) throw new Error('Failed to fetch availability');
      return res.json() as Promise<AvailabilitySlot[]>;
    },
  });

  const { data: providers } = useQuery({
    queryKey: ['providers-list'],
    queryFn: async () => {
      const res = await fetch('/api/v1/providers');
      if (!res.ok) throw new Error('Failed to fetch providers');
      return res.json() as Promise<ProviderOption[]>;
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: Omit<AvailabilitySlot, 'id'>) => {
      const res = await fetch('/api/v1/availability', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error('Failed to create availability');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['availability'] });
      resetForm();
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<AvailabilitySlot> }) => {
      const res = await fetch(`/api/v1/availability/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error('Failed to update availability');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['availability'] });
      resetForm();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/v1/availability/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete availability');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['availability'] });
    },
  });

  const resetForm = () => {
    setProviderId('');
    setDayOfWeek('1');
    setStartTime('09:00');
    setEndTime('17:00');
    setShowForm(false);
    setEditingId(null);
  };

  const handleEdit = (slot: AvailabilitySlot) => {
    setProviderId(slot.providerId);
    setDayOfWeek(String(slot.dayOfWeek));
    setStartTime(slot.startTime);
    setEndTime(slot.endTime);
    setEditingId(slot.id);
    setShowForm(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const data = { providerId, dayOfWeek: Number(dayOfWeek), startTime, endTime };
    if (editingId) {
      updateMutation.mutate({ id: editingId, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const getProviderName = (pid: string) => {
    const p = providers?.find((pr) => pr.id === pid);
    return p ? `${p.firstName} ${p.lastName}` : 'Unknown';
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Availability</h1>
          <p className="text-muted-foreground">Manage provider weekly schedules</p>
        </div>
        <button
          onClick={() => { resetForm(); setShowForm(true); }}
          className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium"
        >
          <Plus className="w-4 h-4" />
          New Slot
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="border rounded-lg p-4 space-y-4">
          <h3 className="font-medium">{editingId ? 'Edit' : 'New'} Availability Slot</h3>
          <div className="grid grid-cols-2 gap-4">
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
              <label className="block text-sm font-medium mb-1">Day</label>
              <select value={dayOfWeek} onChange={(e) => setDayOfWeek(e.target.value)} className="w-full px-3 py-2 border rounded-md text-sm">
                {DAYS.map((d, i) => (
                  <option key={i} value={i}>{d}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Start Time</label>
              <input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} className="w-full px-3 py-2 border rounded-md text-sm" required />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">End Time</label>
              <input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} className="w-full px-3 py-2 border rounded-md text-sm" required />
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
                <th className="text-left px-4 py-3 font-medium">Provider</th>
                <th className="text-left px-4 py-3 font-medium">Day</th>
                <th className="text-left px-4 py-3 font-medium">Hours</th>
                <th className="text-left px-4 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {slots?.map((slot) => (
                <tr key={slot.id} className="hover:bg-muted/20">
                  <td className="px-4 py-3">{getProviderName(slot.providerId)}</td>
                  <td className="px-4 py-3">{DAYS[slot.dayOfWeek]}</td>
                  <td className="px-4 py-3">{slot.startTime} - {slot.endTime}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button onClick={() => handleEdit(slot)} className="p-2 hover:bg-muted rounded"><Pencil className="w-4 h-4" /></button>
                      <button onClick={() => deleteMutation.mutate(slot.id)} className="p-2 hover:bg-muted rounded text-red-600"><Trash2 className="w-4 h-4" /></button>
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
