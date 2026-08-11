import { createFileRoute } from '@tanstack/react-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { Plus, Pencil, Trash2, X } from 'lucide-react';
import { cn } from '@danta/ui';

export const Route = createFileRoute('/imaging-images/')({
  component: ImagingImagesPage,
});

type ImagingImage = {
  id: string;
  imagingStudyId: string;
  toothNumber?: number;
  imageType: string;
  fileName: string;
  mimeType: string;
  size: number;
  url?: string;
  uploadedBy?: string;
};

type StudyOption = { id: string; patient: { firstName: string; lastName: string } };

const IMAGE_TYPE_COLORS: Record<string, string> = {
  original: 'bg-blue-100 text-blue-800',
  processed: 'bg-green-100 text-green-800',
  thumbnail: 'bg-gray-100 text-gray-800',
  dicom: 'bg-purple-100 text-purple-800',
};

export function ImagingImagesPage() {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [imagingStudyId, setImagingStudyId] = useState('');
  const [toothNumber, setToothNumber] = useState('');
  const [imageType, setImageType] = useState('original');
  const [fileName, setFileName] = useState('');
  const [mimeType, setMimeType] = useState('');
  const [size, setSize] = useState('');
  const [storageKey, setStorageKey] = useState('');
  const [url, setUrl] = useState('');
  const [viewingImage, setViewingImage] = useState<string | null>(null);

  const { data: images, isLoading } = useQuery({
    queryKey: ['imaging-images'],
    queryFn: async () => {
      const res = await fetch('/api/v1/imaging-images');
      if (!res.ok) throw new Error('Failed to fetch imaging images');
      return res.json() as Promise<ImagingImage[]>;
    },
  });

  const { data: studies } = useQuery({
    queryKey: ['imaging-studies-list'],
    queryFn: async () => {
      const res = await fetch('/api/v1/imaging-studies');
      if (!res.ok) throw new Error('Failed to fetch imaging studies');
      return res.json() as Promise<StudyOption[]>;
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await fetch('/api/v1/imaging-images', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error('Failed to create imaging image');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['imaging-images'] });
      resetForm();
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const res = await fetch(`/api/v1/imaging-images/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error('Failed to update imaging image');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['imaging-images'] });
      resetForm();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/v1/imaging-images/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete imaging image');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['imaging-images'] });
    },
  });

  const resetForm = () => {
    setImagingStudyId('');
    setToothNumber('');
    setImageType('original');
    setFileName('');
    setMimeType('');
    setSize('');
    setStorageKey('');
    setUrl('');
    setShowForm(false);
    setEditingId(null);
  };

  const handleEdit = (image: ImagingImage) => {
    setImagingStudyId(image.imagingStudyId);
    setToothNumber(image.toothNumber ? String(image.toothNumber) : '');
    setImageType(image.imageType);
    setFileName(image.fileName);
    setMimeType(image.mimeType);
    setSize(String(image.size));
    setStorageKey('');
    setUrl(image.url || '');
    setEditingId(image.id);
    setShowForm(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const data: any = {
      imagingStudyId,
      imageType,
      fileName,
      mimeType,
      size: Number(size),
      storageKey,
      url: url || undefined,
    };
    if (toothNumber) data.toothNumber = Number(toothNumber);

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
          <h1 className="text-2xl font-bold">Imaging Images</h1>
          <p className="text-muted-foreground">Manage individual images within studies</p>
        </div>
        <button
          onClick={() => { resetForm(); setShowForm(true); }}
          className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium"
        >
          <Plus className="w-4 h-4" />
          New Image
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="border rounded-lg p-4 space-y-4">
          <h3 className="font-medium">{editingId ? 'Edit' : 'New'} Imaging Image</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Imaging Study</label>
              <select value={imagingStudyId} onChange={(e) => setImagingStudyId(e.target.value)} className="w-full px-3 py-2 border rounded-md text-sm" required>
                <option value="">Select study</option>
                {studies?.map((s) => (
                  <option key={s.id} value={s.id}>Study {s.patient.firstName} {s.patient.lastName}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Image Type</label>
              <select value={imageType} onChange={(e) => setImageType(e.target.value)} className="w-full px-3 py-2 border rounded-md text-sm">
                <option value="original">Original</option>
                <option value="processed">Processed</option>
                <option value="thumbnail">Thumbnail</option>
                <option value="dicom">DICOM</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">File Name</label>
              <input value={fileName} onChange={(e) => setFileName(e.target.value)} className="w-full px-3 py-2 border rounded-md text-sm" required />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">MIME Type</label>
              <input value={mimeType} onChange={(e) => setMimeType(e.target.value)} className="w-full px-3 py-2 border rounded-md text-sm" required />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Size (bytes)</label>
              <input type="number" value={size} onChange={(e) => setSize(e.target.value)} className="w-full px-3 py-2 border rounded-md text-sm" required />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Tooth Number (optional)</label>
              <input type="number" value={toothNumber} onChange={(e) => setToothNumber(e.target.value)} className="w-full px-3 py-2 border rounded-md text-sm" min="1" max="85" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Storage Key</label>
              <input value={storageKey} onChange={(e) => setStorageKey(e.target.value)} className="w-full px-3 py-2 border rounded-md text-sm" required />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">URL (optional)</label>
              <input value={url} onChange={(e) => setUrl(e.target.value)} className="w-full px-3 py-2 border rounded-md text-sm" />
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
                <th className="text-left px-4 py-3 font-medium">Study</th>
                <th className="text-left px-4 py-3 font-medium">File</th>
                <th className="text-left px-4 py-3 font-medium">Type</th>
                <th className="text-left px-4 py-3 font-medium">Tooth</th>
                <th className="text-left px-4 py-3 font-medium">Size</th>
                <th className="text-left px-4 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {images?.map((image) => (
                <tr key={image.id} className="hover:bg-muted/20">
                  <td className="px-4 py-3">{image.imagingStudyId.slice(0, 8)}...</td>
                  <td className="px-4 py-3">{image.fileName}</td>
                  <td className="px-4 py-3">
                    <span className={cn('px-2 py-1 rounded-full text-xs font-medium', IMAGE_TYPE_COLORS[image.imageType] || 'bg-gray-100 text-gray-800')}>
                      {image.imageType}
                    </span>
                  </td>
                  <td className="px-4 py-3">{image.toothNumber ?? '-'}</td>
                  <td className="px-4 py-3">{(image.size / 1024).toFixed(1)} KB</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      {image.url && (
                        <button onClick={() => setViewingImage(image.url!)} className="p-2 hover:bg-muted rounded" title="View Image">
                          <Plus className="w-4 h-4" />
                        </button>
                      )}
                      <button onClick={() => handleEdit(image)} className="p-2 hover:bg-muted rounded"><Pencil className="w-4 h-4" /></button>
                      <button onClick={() => deleteMutation.mutate(image.id)} className="p-2 hover:bg-muted rounded text-red-600"><Trash2 className="w-4 h-4" /></button>
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
