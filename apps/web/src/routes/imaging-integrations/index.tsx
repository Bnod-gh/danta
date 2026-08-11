import { createFileRoute } from '@tanstack/react-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { cn } from '@danta/ui';

export const Route = createFileRoute('/imaging-integrations/')({
  component: ImagingIntegrationsPage,
});

type ImagingIntegration = {
  id: string;
  name: string;
  provider: string;
  isActive: boolean;
  config?: Record<string, unknown>;
};

export function ImagingIntegrationsPage() {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [provider, setProvider] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [config, setConfig] = useState('{}');

  const { data: integrations, isLoading } = useQuery({
    queryKey: ['imaging-integrations'],
    queryFn: async () => {
      const res = await fetch('/api/v1/imaging-integrations');
      if (!res.ok) throw new Error('Failed to fetch imaging integrations');
      return res.json() as Promise<ImagingIntegration[]>;
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await fetch('/api/v1/imaging-integrations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error('Failed to create imaging integration');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['imaging-integrations'] });
      resetForm();
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<ImagingIntegration> }) => {
      const res = await fetch(`/api/v1/imaging-integrations/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error('Failed to update imaging integration');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['imaging-integrations'] });
      resetForm();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/v1/imaging-integrations/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete imaging integration');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['imaging-integrations'] });
    },
  });

  const resetForm = () => {
    setName('');
    setProvider('');
    setIsActive(true);
    setConfig('{}');
    setShowForm(false);
    setEditingId(null);
  };

  const handleEdit = (integration: ImagingIntegration) => {
    setName(integration.name);
    setProvider(integration.provider);
    setIsActive(integration.isActive);
    setConfig(JSON.stringify(integration.config || {}, null, 2));
    setEditingId(integration.id);
    setShowForm(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const data = { name, provider, isActive, config: JSON.parse(config) };
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
          <h1 className="text-2xl font-bold">Imaging Integrations</h1>
          <p className="text-muted-foreground">Manage imaging providers and storage</p>
        </div>
        <button
          onClick={() => { resetForm(); setShowForm(true); }}
          className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium"
        >
          <Plus className="w-4 h-4" />
          New Integration
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="border rounded-lg p-4 space-y-4">
          <h3 className="font-medium">{editingId ? 'Edit' : 'New'} Imaging Integration</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Name</label>
              <input value={name} onChange={(e) => setName(e.target.value)} className="w-full px-3 py-2 border rounded-md text-sm" required />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Provider</label>
              <input value={provider} onChange={(e) => setProvider(e.target.value)} className="w-full px-3 py-2 border rounded-md text-sm" required />
            </div>
            <div className="flex items-center gap-2">
              <input type="checkbox" id="isActive" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} className="rounded" />
              <label htmlFor="isActive" className="text-sm font-medium">Active</label>
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium mb-1">Config (JSON)</label>
              <textarea value={config} onChange={(e) => setConfig(e.target.value)} className="w-full px-3 py-2 border rounded-md text-sm font-mono" rows={4} />
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
                <th className="text-left px-4 py-3 font-medium">Provider</th>
                <th className="text-left px-4 py-3 font-medium">Active</th>
                <th className="text-left px-4 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {integrations?.map((integration) => (
                <tr key={integration.id} className="hover:bg-muted/20">
                  <td className="px-4 py-3">{integration.name}</td>
                  <td className="px-4 py-3">{integration.provider}</td>
                  <td className="px-4 py-3">
                    <span className={cn('px-2 py-1 rounded-full text-xs font-medium', integration.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800')}>
                      {integration.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button onClick={() => handleEdit(integration)} className="p-2 hover:bg-muted rounded"><Pencil className="w-4 h-4" /></button>
                      <button onClick={() => deleteMutation.mutate(integration.id)} className="p-2 hover:bg-muted rounded text-red-600"><Trash2 className="w-4 h-4" /></button>
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
