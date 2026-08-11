import { createFileRoute } from '@tanstack/react-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { Plus, Pencil, Trash2 } from 'lucide-react';

export const Route = createFileRoute('/chairs/')({
  component: ChairsPage,
});

type Chair = {
  id: string;
  name: string;
  locationId?: string;
  isActive: boolean;
};

export function ChairsPage() {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [locationId, setLocationId] = useState('');

  const { data: chairs, isLoading } = useQuery({
    queryKey: ['chairs'],
    queryFn: async () => {
      const res = await fetch('/api/v1/chairs');
      if (!res.ok) throw new Error('Failed to fetch chairs');
      return res.json() as Promise<Chair[]>;
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: Omit<Chair, 'id'>) => {
      const res = await fetch('/api/v1/chairs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error('Failed to create chair');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chairs'] });
      resetForm();
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Chair> }) => {
      const res = await fetch(`/api/v1/chairs/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error('Failed to update chair');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chairs'] });
      resetForm();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/v1/chairs/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete chair');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chairs'] });
    },
  });

  const resetForm = () => {
    setName('');
    setLocationId('');
    setShowForm(false);
    setEditingId(null);
  };

  const handleEdit = (chair: Chair) => {
    setName(chair.name);
    setLocationId(chair.locationId || '');
    setEditingId(chair.id);
    setShowForm(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const data = { name, locationId: locationId || undefined, isActive: true };
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
          <h1 className="text-2xl font-bold">Chairs</h1>
          <p className="text-muted-foreground">Manage dental chairs and operatories</p>
        </div>
        <button
          onClick={() => { resetForm(); setShowForm(true); }}
          className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium"
        >
          <Plus className="w-4 h-4" />
          New Chair
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="border rounded-lg p-4 space-y-4">
          <h3 className="font-medium">{editingId ? 'Edit' : 'New'} Chair</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Name</label>
              <input value={name} onChange={(e) => setName(e.target.value)} className="w-full px-3 py-2 border rounded-md text-sm" required />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Location ID (optional)</label>
              <input value={locationId} onChange={(e) => setLocationId(e.target.value)} className="w-full px-3 py-2 border rounded-md text-sm" />
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
                <th className="text-left px-4 py-3 font-medium">Name</th>
                <th className="text-left px-4 py-3 font-medium">Location</th>
                <th className="text-left px-4 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {chairs?.map((chair) => (
                <tr key={chair.id} className="hover:bg-muted/20">
                  <td className="px-4 py-3">{chair.name}</td>
                  <td className="px-4 py-3">{chair.locationId ? 'Assigned' : '-'}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button onClick={() => handleEdit(chair)} className="p-2 hover:bg-muted rounded"><Pencil className="w-4 h-4" /></button>
                      <button onClick={() => deleteMutation.mutate(chair.id)} className="p-2 hover:bg-muted rounded text-red-600"><Trash2 className="w-4 h-4" /></button>
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
