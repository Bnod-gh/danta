import { createFileRoute } from '@tanstack/react-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { cn } from '@danta/ui';

export const Route = createFileRoute('/communication-templates/')({
  component: CommunicationTemplatesPage,
});

type CommunicationTemplate = {
  id: string;
  name: string;
  category: string;
  channel: string;
  subject?: string;
  body: string;
  isActive: boolean;
};

export function CommunicationTemplatesPage() {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [category, setCategory] = useState('');
  const [channel, setChannel] = useState('email');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [isActive, setIsActive] = useState(true);

  const { data: templates, isLoading } = useQuery({
    queryKey: ['communication-templates'],
    queryFn: async () => {
      const res = await fetch('/api/v1/communication-templates');
      if (!res.ok) throw new Error('Failed to fetch communication templates');
      return res.json() as Promise<CommunicationTemplate[]>;
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: { name: string; category: string; channel: string; subject?: string; body: string; isActive: boolean }) => {
      const res = await fetch('/api/v1/communication-templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error('Failed to create template');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['communication-templates'] });
      resetForm();
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: { name?: string; category?: string; channel?: string; subject?: string; body?: string; isActive?: boolean } }) => {
      const res = await fetch(`/api/v1/communication-templates/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error('Failed to update template');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['communication-templates'] });
      resetForm();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/v1/communication-templates/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete template');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['communication-templates'] });
    },
  });

  const resetForm = () => {
    setName('');
    setCategory('');
    setChannel('email');
    setSubject('');
    setBody('');
    setIsActive(true);
    setShowForm(false);
    setEditingId(null);
  };

  const handleEdit = (t: CommunicationTemplate) => {
    setName(t.name);
    setCategory(t.category);
    setChannel(t.channel);
    setSubject(t.subject || '');
    setBody(t.body);
    setIsActive(t.isActive);
    setEditingId(t.id);
    setShowForm(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const data = { name, category, channel, subject: subject || undefined, body, isActive };
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
          <h1 className="text-2xl font-bold">Communication Templates</h1>
          <p className="text-muted-foreground">Manage SMS, email, and notification templates</p>
        </div>
        <button
          onClick={() => { resetForm(); setShowForm(true); }}
          className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium"
        >
          <Plus className="w-4 h-4" />
          New Template
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="border rounded-lg p-4 space-y-4">
          <h3 className="font-medium">{editingId ? 'Edit' : 'New'} Template</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Name</label>
              <input value={name} onChange={(e) => setName(e.target.value)} className="w-full px-3 py-2 border rounded-md text-sm" required />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Category</label>
              <select value={category} onChange={(e) => setCategory(e.target.value)} className="w-full px-3 py-2 border rounded-md text-sm" required>
                <option value="">Select category</option>
                <option value="appointment">Appointment</option>
                <option value="recall">Recall</option>
                <option value="billing">Billing</option>
                <option value="clinical">Clinical</option>
                <option value="welcome">Welcome</option>
                <option value="form">Form Request</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Channel</label>
              <select value={channel} onChange={(e) => setChannel(e.target.value)} className="w-full px-3 py-2 border rounded-md text-sm">
                <option value="email">Email</option>
                <option value="sms">SMS</option>
                <option value="in_app">In-App</option>
                <option value="patient_portal">Patient Portal</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Subject</label>
              <input value={subject} onChange={(e) => setSubject(e.target.value)} className="w-full px-3 py-2 border rounded-md text-sm" />
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium mb-1">Body</label>
              <textarea value={body} onChange={(e) => setBody(e.target.value)} className="w-full px-3 py-2 border rounded-md text-sm" rows={4} required />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Active</label>
              <select value={isActive ? 'true' : 'false'} onChange={(e) => setIsActive(e.target.value === 'true')} className="w-full px-3 py-2 border rounded-md text-sm">
                <option value="true">Yes</option>
                <option value="false">No</option>
              </select>
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
                <th className="text-left px-4 py-3 font-medium">Category</th>
                <th className="text-left px-4 py-3 font-medium">Channel</th>
                <th className="text-left px-4 py-3 font-medium">Active</th>
                <th className="text-left px-4 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {templates?.map((t) => (
                <tr key={t.id} className="hover:bg-muted/20">
                  <td className="px-4 py-3">{t.name}</td>
                  <td className="px-4 py-3 capitalize">{t.category}</td>
                  <td className="px-4 py-3 capitalize">{t.channel.replace('_', ' ')}</td>
                  <td className="px-4 py-3">
                    <span className={cn('px-2 py-1 rounded-full text-xs font-medium', t.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800')}>
                      {t.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button onClick={() => handleEdit(t)} className="p-2 hover:bg-muted rounded"><Pencil className="w-4 h-4" /></button>
                      <button onClick={() => deleteMutation.mutate(t.id)} className="p-2 hover:bg-muted rounded text-red-600"><Trash2 className="w-4 h-4" /></button>
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
