import { createFileRoute } from '@tanstack/react-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { Plus, Pencil, Trash2, X } from 'lucide-react';
import { cn } from '@danta/ui';

export const Route = createFileRoute('/imaging-studies/')({
  component: ImagingStudiesPage,
});

type ImagingStudy = {
  id: string;
  patient: { firstName: string; lastName: string };
  provider: { firstName: string; lastName: string };
  modality: string;
  studyDate: string;
  status: string;
  description?: string;
  images: Array<{ id: string; fileName: string; imageType: string; url?: string }>;
};

type PatientOption = { id: string; firstName: string; lastName: string };
type ProviderOption = { id: string; firstName: string; lastName: string };

const MODALITY_COLORS: Record<string, string> = {
  xray: 'bg-gray-100 text-gray-800',
  ct: 'bg-blue-100 text-blue-800',
  mri: 'bg-purple-100 text-purple-800',
  panoramic: 'bg-green-100 text-green-800',
  cbct: 'bg-orange-100 text-orange-800',
  intraoral: 'bg-yellow-100 text-yellow-800',
  extraoral: 'bg-pink-100 text-pink-800',
  other: 'bg-gray-100 text-gray-800',
};

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  in_progress: 'bg-blue-100 text-blue-800',
  completed: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800',
};

export function ImagingStudiesPage() {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [viewingImage, setViewingImage] = useState<string | null>(null);
  const [patientId, setPatientId] = useState('');
  const [providerId, setProviderId] = useState('');
  const [modality, setModality] = useState('panoramic');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState('pending');

  const { data: studies, isLoading } = useQuery({
    queryKey: ['imaging-studies'],
    queryFn: async () => {
      const res = await fetch('/api/v1/imaging-studies');
      if (!res.ok) throw new Error('Failed to fetch imaging studies');
      return res.json() as Promise<ImagingStudy[]>;
    },
  });

  const { data: patients } = useQuery({
    queryKey: ['patients-list'],
    queryFn: async () => {
      const res = await fetch('/api/v1/patients');
      if (!res.ok) throw new Error('Failed to fetch patients');
      return res.json() as Promise<{ patients: PatientOption[] }>;
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
    mutationFn: async (data: any) => {
      const res = await fetch('/api/v1/imaging-studies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error('Failed to create imaging study');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['imaging-studies'] });
      resetForm();
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const res = await fetch(`/api/v1/imaging-studies/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error('Failed to update imaging study');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['imaging-studies'] });
      resetForm();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/v1/imaging-studies/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete imaging study');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['imaging-studies'] });
    },
  });

  const resetForm = () => {
    setPatientId('');
    setProviderId('');
    setModality('panoramic');
    setDescription('');
    setStatus('pending');
    setShowForm(false);
    setEditingId(null);
  };

  const handleEdit = (study: ImagingStudy) => {
    setPatientId(study.patient.firstName + ' ' + study.patient.lastName);
    setProviderId(study.provider.firstName + ' ' + study.provider.lastName);
    setModality(study.modality);
    setDescription(study.description || '');
    setStatus(study.status);
    setEditingId(study.id);
    setShowForm(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const data = { patientId, providerId, modality, description: description || undefined, status };
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
          <h1 className="text-2xl font-bold">Imaging Studies</h1>
          <p className="text-muted-foreground">Manage dental imaging and X-rays</p>
        </div>
        <button
          onClick={() => { resetForm(); setShowForm(true); }}
          className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium"
        >
          <Plus className="w-4 h-4" />
          New Study
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="border rounded-lg p-4 space-y-4">
          <h3 className="font-medium">{editingId ? 'Edit' : 'New'} Imaging Study</h3>
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
              <label className="block text-sm font-medium mb-1">Modality</label>
              <select value={modality} onChange={(e) => setModality(e.target.value)} className="w-full px-3 py-2 border rounded-md text-sm">
                <option value="xray">X-Ray</option>
                <option value="panoramic">Panoramic</option>
                <option value="cbct">CBCT</option>
                <option value="intraoral">Intraoral</option>
                <option value="extraoral">Extraoral</option>
                <option value="ct">CT</option>
                <option value="mri">MRI</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Status</label>
              <select value={status} onChange={(e) => setStatus(e.target.value)} className="w-full px-3 py-2 border rounded-md text-sm">
                <option value="pending">Pending</option>
                <option value="in_progress">In Progress</option>
                <option value="completed">Completed</option>
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
                <th className="text-left px-4 py-3 font-medium">Modality</th>
                <th className="text-left px-4 py-3 font-medium">Date</th>
                <th className="text-left px-4 py-3 font-medium">Status</th>
                <th className="text-left px-4 py-3 font-medium">Images</th>
                <th className="text-left px-4 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {studies?.map((study) => (
                <tr key={study.id} className="hover:bg-muted/20">
                  <td className="px-4 py-3">{study.patient.firstName} {study.patient.lastName}</td>
                  <td className="px-4 py-3">{study.provider.firstName} {study.provider.lastName}</td>
                  <td className="px-4 py-3">
                    <span className={cn('px-2 py-1 rounded-full text-xs font-medium', MODALITY_COLORS[study.modality] || 'bg-gray-100 text-gray-800')}>
                      {study.modality}
                    </span>
                  </td>
                  <td className="px-4 py-3">{new Date(study.studyDate).toLocaleDateString()}</td>
                  <td className="px-4 py-3">
                    <span className={cn('px-2 py-1 rounded-full text-xs font-medium', STATUS_COLORS[study.status] || 'bg-gray-100 text-gray-800')}>
                      {study.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">{study.images?.length || 0}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button onClick={() => handleEdit(study)} className="p-2 hover:bg-muted rounded"><Pencil className="w-4 h-4" /></button>
                      <button onClick={() => deleteMutation.mutate(study.id)} className="p-2 hover:bg-muted rounded text-red-600"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {viewingImage && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setViewingImage(null)}>
          <div className="bg-white rounded-lg p-4 max-w-4xl max-h-[90vh] overflow-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-medium">Image Viewer</h3>
              <button onClick={() => setViewingImage(null)} className="p-2 hover:bg-muted rounded"><X className="w-4 h-4" /></button>
            </div>
            <img src={viewingImage} alt="Imaging" className="max-w-full max-h-[70vh] object-contain" />
          </div>
        </div>
      )}
    </div>
  );
}
