import { useEffect, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Download, Trash2, X, FileImage, Upload } from 'lucide-react';
import { Badge } from '@danta/ui/badge';
import { Button } from '@danta/ui/button';
import { Card, CardContent } from '@danta/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@danta/ui/dialog';
import { Skeleton } from '@danta/ui/skeleton';
import { Checkbox } from '@danta/ui/checkbox';
import { getPatientImaging, downloadImageOriginal, downloadImageThumbnail, deleteImage } from '../../lib/api/imaging';
import type { ImageRow } from '../../lib/api/imaging';
import { toast } from 'sonner';

interface PatientImagingGalleryProps {
  patientId: string;
  patientName: string;
}

const MODALITY_LABELS: Record<string, string> = {
  intraoral: 'Intraoral',
  bitewing: 'Bitewing',
  periapical: 'Periapical',
  panoramic: 'Panoramic',
  cbct: 'CBCT',
  other: 'Other',
};

export function PatientImagingGallery({ patientId, patientName }: PatientImagingGalleryProps) {
  const [viewerImage, setViewerImage] = useState<ImageRow | null>(null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [selectedImages, setSelectedImages] = useState<Set<string>>(new Set());
  const queryClient = useQueryClient();

  const { data: studies, isLoading, error } = useQuery({
    queryKey: ['patient-imaging', patientId],
    queryFn: () => getPatientImaging(patientId),
    enabled: !!patientId,
  });

  const allStudies = studies ?? [];
  const allImages = allStudies.flatMap((study) =>
    (study.images ?? []).map((img) => ({ ...img, _studyModality: study.modality ?? 'other' }))
  );
  const allSelected = allImages.length > 0 && allImages.every((img) => selectedImages.has(img.id));

  const imagesByModality = allImages.reduce<Record<string, ImageRow[]>>((acc, img) => {
    const modality = (img as any)._studyModality ?? 'other';
    if (!acc[modality]) acc[modality] = [];
    acc[modality].push(img);
    return acc;
  }, {});

  const handleDownload = async (imageId: string, fileName: string) => {
    setDownloadingId(imageId);
    try {
      const blob = await downloadImageOriginal(imageId);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success(`Downloaded ${fileName}`);
    } catch {
      toast.error('Download failed');
    } finally {
      setDownloadingId(null);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedImages.size === 0) return;
    if (!confirm(`Delete ${selectedImages.size} image(s)? This cannot be undone.`)) return;
    try {
      await Promise.all(Array.from(selectedImages).map((id) => deleteImage(id)));
      toast.success(`${selectedImages.size} image(s) deleted`);
      queryClient.invalidateQueries({ queryKey: ['patient-imaging', patientId] });
      setSelectedImages(new Set());
    } catch {
      toast.error('Failed to delete some images');
    }
  };

  const handleBulkDownload = async () => {
    if (selectedImages.size === 0) return;
    for (const imageId of selectedImages) {
      const image = allImages.find((i) => i.id === imageId);
      if (image) {
        await handleDownload(imageId, image.fileName);
      }
    }
  };

  const toggleSelection = (imageId: string, checked: boolean) => {
    setSelectedImages((prev) => {
      const next = new Set(prev);
      if (checked) next.add(imageId);
      else next.delete(imageId);
      return next;
    });
  };

  const toggleAll = (checked: boolean) => {
    if (checked) {
      setSelectedImages(new Set(allImages.map((img) => img.id)));
    } else {
      setSelectedImages(new Set());
    }
  };

  useEffect(() => {
    if (!allImages.length) return;
    allImages.forEach((image) => {
      queryClient.prefetchQuery({
        queryKey: ['imaging-image-blob', image.id],
        queryFn: () => downloadImageOriginal(image.id),
        staleTime: 5 * 60 * 1000,
      });
    });
  }, [allImages.map((img) => img.id).join(',')]);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-4">
                <Skeleton className="h-48 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">Failed to load imaging studies</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Imaging Gallery — {patientName}</h2>
          <p className="text-sm text-muted-foreground mt-1">
            {allStudies.length} {allStudies.length === 1 ? 'study' : 'studies'} · {allImages.length} image{allImages.length !== 1 ? 's' : ''}
          </p>
        </div>
        <Button variant="outline" size="sm" className="gap-1.5">
          <Upload className="h-4 w-4" />
          Upload
        </Button>
      </div>

      {selectedImages.size > 0 && (
        <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-md">
          <Checkbox
            checked={allSelected}
            onChange={(e) => toggleAll(e.target.checked)}
            aria-label="Select all"
          />
          <span className="text-sm">{selectedImages.size} selected</span>
          <Button variant="ghost" size="sm" onClick={handleBulkDownload} disabled={downloadingId !== null}>
            <Download className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={handleBulkDelete} className="text-destructive">
            <Trash2 className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setSelectedImages(new Set())}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}

      {allImages.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FileImage className="h-12 w-12 text-muted-foreground/50" />
            <p className="mt-4 text-muted-foreground">No imaging studies found for this patient.</p>
            <Button className="mt-4 gap-1.5">
              <Upload className="h-4 w-4" />
              Start acquisition
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {Object.entries(imagesByModality).map(([modality, modalityImages]) => {
            const modalityLabel = MODALITY_LABELS[modality] ?? modality;
            return (
              <div key={modality}>
                <h3 className="text-sm font-medium text-muted-foreground mb-2">{modalityLabel}</h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3">
                  {modalityImages.map((image) => (
                    <ImageThumb
                      key={image.id}
                      image={image}
                      onClick={() => setViewerImage(image as ImageRow)}
                      selectedImages={selectedImages}
                      toggleSelection={toggleSelection}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Dialog open={!!viewerImage} onOpenChange={(open) => !open && setViewerImage(null)}>
        <DialogContent className="max-w-4xl p-0">
          <DialogHeader className="p-4 pb-0">
            <DialogTitle>{viewerImage?.fileName}</DialogTitle>
          </DialogHeader>
          {viewerImage && <ImageViewer imageId={viewerImage.id} fileName={viewerImage.fileName} />}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function ImageViewer({ imageId, fileName }: { imageId: string; fileName?: string }) {
  const { data: blob, isLoading, error } = useQuery({
    queryKey: ['imaging-image-blob', imageId],
    queryFn: () => downloadImageOriginal(imageId),
    staleTime: 5 * 60 * 1000,
  });

  const [blobUrl, setBlobUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!blob) {
      setBlobUrl(null);
      return;
    }
    const url = URL.createObjectURL(blob);
    setBlobUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [blob]);

  if (isLoading) {
    return <Skeleton className="h-96 w-full" />;
  }

  if (error) {
    return <div className="p-8 text-center text-destructive">Failed to load image: {(error as Error).message}</div>;
  }

  if (!blobUrl) {
    return null;
  }

  return (
    <div className="p-4 flex justify-center">
      <img src={blobUrl} alt={fileName ?? imageId} className="max-w-full max-h-[70vh] object-contain" />
    </div>
  );
}

interface ImageThumbProps {
  image: ImageRow;
  onClick: () => void;
  selectedImages: Set<string>;
  toggleSelection: (imageId: string, checked: boolean) => void;
}

function ImageThumb({ image, onClick, selectedImages, toggleSelection }: ImageThumbProps) {
  const isSelected = selectedImages.has(image.id);
  const [thumbLoading, setThumbLoading] = useState(true);
  const [thumbError, setThumbError] = useState(false);
  const [thumbUrl, setThumbUrl] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    let url: string | null = null;
    setThumbLoading(true);
    setThumbError(false);
    setThumbUrl(null);
    downloadImageThumbnail(image.id)
      .then((blob) => {
        if (cancelled) return;
        url = URL.createObjectURL(blob);
        setThumbUrl(url);
        setThumbLoading(false);
      })
      .catch(() => {
        if (cancelled) return;
        setThumbLoading(false);
        setThumbError(true);
      });
    return () => {
      cancelled = true;
      if (url) URL.revokeObjectURL(url);
    };
  }, [image.id]);

  return (
    <div className="relative group aspect-square">
      <button
        type="button"
        onClick={onClick}
        className={`w-full h-full relative rounded border transition-all ${isSelected ? 'ring-2 ring-primary' : 'hover:opacity-85'}`}
      >
        {thumbLoading && !thumbError && <Skeleton className="h-full w-full absolute inset-0 rounded" />}
        {!thumbLoading && thumbError && (
          <div className="h-full w-full flex items-center justify-center bg-muted rounded">
            <FileImage className="h-6 w-6 text-muted-foreground/50" />
          </div>
        )}
        {!thumbLoading && !thumbError && thumbUrl && (
          <img
            src={thumbUrl}
            alt={image.fileName}
            className="h-full w-full object-cover rounded"
            loading="lazy"
          />
        )}
        {!thumbLoading && !thumbError && !thumbUrl && (
          <div className="h-full w-full flex items-center justify-center bg-muted rounded">
            <FileImage className="h-6 w-6 text-muted-foreground/50" />
          </div>
        )}
        {image.toothNumber && (
          <Badge variant="secondary" className="absolute top-1 right-1 h-4 px-1 text-[9px] font-mono">
            {image.toothNumber}
          </Badge>
        )}
      </button>
      <Checkbox
        checked={isSelected}
        onChange={(e) => toggleSelection(image.id, e.target.checked)}
        className="absolute top-1 left-1 h-4 w-4 bg-white/80"
        onClick={(e) => e.stopPropagation()}
      />
    </div>
  );
}
