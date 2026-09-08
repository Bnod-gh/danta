import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useRef, useState } from 'react';
import { Pencil, Printer, Search, Upload, Radiation, Trash2 } from 'lucide-react';
import { Button } from '@danta/ui/button';
import { Input } from '@danta/ui/input';
import { Label } from '@danta/ui/label';
import { Badge } from '@danta/ui/badge';
import { Skeleton } from '@danta/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@danta/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@danta/ui/table';
import {
  Select,
} from '@danta/ui/select';
import { RadiographViewer } from '../../components/imaging/RadiographViewer';
import { CameraCaptureDialog } from '../../components/imaging/CameraCaptureDialog';
import { ensureOpenStudy, getImages, updateImage, uploadImage, deleteImage, type ImageRow } from '../../lib/api/imaging';
import { apiGet } from '../../lib/api/request';
import type { Patient, Provider } from '@danta/schemas';
import { toast } from 'sonner';

const MODALITY_OPTIONS = [
  { value: '', label: 'All modalities' },
  { value: 'intraoral', label: 'Intraoral photo' },
  { value: 'bitewing', label: 'Bitewing' },
  { value: 'periapical', label: 'Periapical' },
  { value: 'panoramic', label: 'Panoramic (Pano)' },
  { value: 'cbct', label: 'CBCT' },
];

export function ImagingImagesPage() {
  const [search, setSearch] = useState('');
  const [modalityFilter, setModalityFilter] = useState('');
  const [captureOpen, setCaptureOpen] = useState(false);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [viewerImage, setViewerImage] = useState<ImageRow | null>(null);
  const [editingTag, setEditingTag] = useState<{ image: ImageRow; value: string } | null>(null);
  const queryClient = useQueryClient();

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['imaging-images', search],
    queryFn: () => getImages(search.trim() ? search.trim() : undefined),
  });

  const images = data ?? [];
  const filtered = modalityFilter
    ? images.filter((image) => image.imagingStudy?.modality === modalityFilter)
    : images;

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ['imaging-images'] });
    queryClient.invalidateQueries({ queryKey: ['imaging-studies'] });
    queryClient.invalidateQueries({ queryKey: ['patient-workspace'] });
  };

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">X-Rays & Imaging</h1>
            <p className="text-muted-foreground">Diagnostic imaging canvas and camera acquisition</p>
          </div>
        </div>
        <div className="text-center py-12">
          <p className="text-destructive mb-4">Failed to load images</p>
          <Button onClick={() => refetch()} variant="outline">Retry</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">X-Rays & Imaging</h1>
          <p className="text-muted-foreground">Diagnostic imaging canvas and camera acquisition</p>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={() => setCaptureOpen(true)} className="gap-1.5">
            <Radiation className="h-4 w-4" />
            Acquisition
          </Button>
          <Button variant="outline" onClick={() => setUploadOpen(true)} className="gap-1.5">
            <Upload className="h-4 w-4" />
            Upload Image
          </Button>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by file name..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className="pl-9"
          />
        </div>
        <select
          value={modalityFilter}
          onChange={(event) => setModalityFilter(event.target.value)}
          className="h-10 px-3 py-2 border rounded-md text-sm bg-background"
        >
          {MODALITY_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>{option.label}</option>
          ))}
        </select>
      </div>

      <div className="border rounded-lg overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>File</TableHead>
              <TableHead>Patient</TableHead>
              <TableHead>Modality</TableHead>
              <TableHead>Tooth</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Size</TableHead>
              <TableHead className="w-24" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell><Skeleton className="h-4 w-36" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-14" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                  <TableCell><Skeleton className="h-8 w-16" /></TableCell>
                </TableRow>
              ))
            ) : filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-12 text-muted-foreground">
                  No images found — capture one with the camera or upload a file.
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((image) => (
                <TableRow key={image.id}>
                  <TableCell className="max-w-52 truncate font-medium">{image.fileName}</TableCell>
                  <TableCell>
                    {image.imagingStudy?.patient ? (
                      <span>
                        {image.imagingStudy.patient.firstName} {image.imagingStudy.patient.lastName}
                        <span className="ml-1 text-xs text-muted-foreground">#{image.imagingStudy.patient.patientNumber}</span>
                      </span>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell className="capitalize">{image.imagingStudy?.modality?.replace(/_/g, ' ') ?? '—'}</TableCell>
                  <TableCell>
                    {editingTag?.image.id === image.id ? (
                      <input
                        autoFocus
                        defaultValue={editingTag.value}
                        className="h-7 w-20 rounded border px-1.5 text-xs"
                        onKeyDown={(event) => void handleTagKey(event, image, setEditingTag, refresh)}
                      />
                    ) : (
                      <button
                        type="button"
                        onClick={() => setEditingTag({ image, value: image.toothNumber ?? '' })}
                        className="group inline-flex items-center gap-1"
                      >
                        {image.toothNumber ? (
                          <Badge variant="secondary" className="font-mono">{image.toothNumber}</Badge>
                        ) : (
                          <span className="text-xs text-muted-foreground group-hover:text-foreground">tag</span>
                        )}
                        <Pencil className="h-3 w-3 opacity-0 transition-opacity group-hover:opacity-100" />
                      </button>
                    )}
                  </TableCell>
                  <TableCell className="text-muted-foreground">{new Date(image.createdAt).toLocaleDateString('en-AU')}</TableCell>
                  <TableCell className="text-muted-foreground">{Math.round(image.size / 1024)} KB</TableCell>
                   <TableCell>
                     <Button variant="ghost" size="sm" onClick={() => setViewerImage(image)}>View</Button>
                     <Button
                       variant="ghost"
                       size="sm"
                       onClick={async (e) => {
                         e.stopPropagation();
                         if (!confirm('Delete this image? This cannot be undone.')) return;
                         try {
                           await deleteImage(image.id);
                           toast.success('Image deleted');
                           refresh();
                         } catch {
                           toast.error('Failed to delete image');
                         }
                       }}
                     >
                       <Trash2 className="h-4 w-4 text-destructive" />
                     </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <CameraCaptureDialog open={captureOpen} onOpenChange={setCaptureOpen} />

      <UploadImagingDialog open={uploadOpen} onOpenChange={setUploadOpen} onUploaded={refresh} />

      <Dialog open={!!viewerImage} onOpenChange={(open) => !open && setViewerImage(null)}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Radiograph viewer</DialogTitle>
            <DialogDescription>
              {viewerImage?.fileName} · windowing, invert, zoom/pan and calibrated measurements
            </DialogDescription>
          </DialogHeader>
          {viewerImage && <RadiographViewer imageId={viewerImage.id} fileName={viewerImage.fileName} />}
          <DialogFooter className="no-print">
            <Button variant="outline" className="gap-1.5" onClick={() => window.print()}>
              <Printer className="h-4 w-4" />
              Print
            </Button>
            <Button variant="outline" onClick={() => setViewerImage(null)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

async function handleTagKey(
  event: React.KeyboardEvent<HTMLInputElement>,
  image: ImageRow,
  setEditingTag: (value: { image: ImageRow; value: string } | null) => void,
  refresh: () => void,
) {
  if (event.key !== 'Enter') {
    if (event.key === 'Escape') setEditingTag(null);
    return;
  }
  const value = event.currentTarget.value.trim();
  try {
    await updateImage(image.id, value ? { toothNumber: value } : {});
    toast.success('Tooth tag updated');
    setEditingTag(null);
    refresh();
  } catch {
    toast.error('Failed to update tooth tag');
  }
}

export function UploadImagingDialog({
  open,
  onOpenChange,
  onUploaded,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUploaded: () => void;
}) {
  const [patientSearch, setPatientSearch] = useState('');
  const [patientId, setPatientId] = useState('');
  const [providerId, setProviderId] = useState('');
  const [modality, setModality] = useState('bitewing');
  const [toothNumber, setToothNumber] = useState('');
  const [saving, setSaving] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();

  const patientsQuery = useQuery({
    queryKey: ['patients', 'for-imaging', patientSearch],
    queryFn: () => apiGet<{ data: Patient[] }>('/patients', { search: patientSearch || undefined, take: 20 }),
    enabled: open,
  });

  const providersQuery = useQuery({
    queryKey: ['providers', 'for-imaging'],
    queryFn: () => apiGet<Provider[]>('/providers'),
    enabled: open,
  });

  const handleUpload = async () => {
    const file = fileRef.current?.files?.[0];
    if (!file) {
      toast.error('Choose an image file');
      return;
    }
    if (!patientId) {
      toast.error('Select a patient');
      return;
    }
    setSaving(true);
    try {
      const studyId = await ensureOpenStudy({
        patientId,
        modality,
        providerId: providerId || undefined,
        providerFallback: (providersQuery.data ?? [])[0]?.id,
        description: `Uploaded ${new Date().toLocaleString('en-AU')}`,
      });
      await uploadImage(file, { imagingStudyId: studyId, toothNumber: toothNumber.trim() || undefined });
      toast.success(`Filed to study ${studyId.slice(0, 8)}`);
      queryClient.invalidateQueries({ queryKey: ['imaging-images'] });
      queryClient.invalidateQueries({ queryKey: ['imaging-studies'] });
      onUploaded();
      onOpenChange(false);
      setToothNumber('');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Upload failed');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Upload imaging file</DialogTitle>
          <DialogDescription>Creates or reuses an open study for the patient and attaches the file.</DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="up-file">File</Label>
            <Input ref={fileRef} id="up-file" type="file" accept="image/*,.dcm" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="up-patient-search">Find patient</Label>
            <Input id="up-patient-search" placeholder="Search by name or number…" value={patientSearch} onChange={(event) => setPatientSearch(event.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="up-patient">Patient</Label>
            <Select id="up-patient" value={patientId} onChange={(event) => setPatientId(event.target.value)}>
              <option value="">Select patient…</option>
              {(patientsQuery.data?.data ?? []).map((patient) => (
                <option key={patient.id} value={patient.id}>
                  {patient.firstName} {patient.lastName} ({patient.patientNumber})
                </option>
              ))}
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="up-provider">Practitioner</Label>
              <Select id="up-provider" value={providerId} onChange={(event) => setProviderId(event.target.value)}>
                <option value="">Auto-assign</option>
                {(providersQuery.data ?? []).map((provider) => (
                  <option key={provider.id} value={provider.id}>Dr {provider.firstName} {provider.lastName}</option>
                ))}
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="up-modality">Modality</Label>
              <Select id="up-modality" value={modality} onChange={(event) => setModality(event.target.value)}>
                {MODALITY_OPTIONS.filter((option) => option.value).map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
                <option value="other">Other</option>
              </Select>
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="up-tooth">Tooth tag (optional)</Label>
            <Input id="up-tooth" value={toothNumber} onChange={(event) => setToothNumber(event.target.value)} placeholder="e.g. 14" />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>Cancel</Button>
          <Button disabled={saving} onClick={() => void handleUpload()}>
            {saving ? 'Uploading…' : 'Upload'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
