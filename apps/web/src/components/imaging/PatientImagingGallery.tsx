import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Download, FileImage, Upload } from 'lucide-react';
import { Badge } from '@danta/ui/badge';
import { Button } from '@danta/ui/button';
import { Card, CardContent } from '@danta/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@danta/ui/dialog';
import { Skeleton } from '@danta/ui/skeleton';
import { RadiographViewer } from './RadiographViewer';
import { getPatientImaging, downloadImageOriginal } from '../../lib/api/imaging';
import type { StudyRow, ImageRow } from '../../lib/api/imaging';
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

  const { data: studies, isLoading, error } = useQuery({
    queryKey: ['patient-imaging', patientId],
    queryFn: () => getPatientImaging(patientId),
    enabled: !!patientId,
  });

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

  const allStudies = studies ?? [];
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Imaging Gallery — {patientName}</h2>
          <p className="text-sm text-muted-foreground mt-1">
            {allStudies.length} {allStudies.length === 1 ? 'study' : 'studies'} · {allStudies.reduce((sum, s) => sum + (s.images?.length ?? 0), 0)} image{allStudies.reduce((sum, s) => sum + (s.images?.length ?? 0), 0) > 1 ? 's' : ''}
          </p>
        </div>
        <Button variant="outline" size="sm" className="gap-1.5">
          <Upload className="h-4 w-4" />
          Upload
        </Button>
      </div>

      {allStudies.length === 0 ? (
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
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {allStudies.map((study) => (
            <StudyCard key={study.id} study={study} onImageClick={setViewerImage} onDownload={handleDownload} downloadingId={downloadingId} />
          ))}
        </div>
      )}

      <Dialog open={!!viewerImage} onOpenChange={(open) => !open && setViewerImage(null)}>
        <DialogContent className="max-w-4xl p-0">
          <DialogHeader className="p-4 pb-0">
            <DialogTitle>{viewerImage?.fileName}</DialogTitle>
          </DialogHeader>
          {viewerImage && <RadiographViewer imageId={viewerImage.id} fileName={viewerImage.fileName} />}
        </DialogContent>
      </Dialog>
    </div>
  );
}

interface StudyCardProps {
  study: StudyRow;
  onImageClick: (image: ImageRow) => void;
  onDownload: (id: string, fileName: string) => void;
  downloadingId: string | null;
}

function StudyCard({ study, onImageClick, onDownload, downloadingId }: StudyCardProps) {
  const modality = study.modality ?? 'other';
  const modalityLabel = MODALITY_LABELS[modality] ?? modality;
  const date = new Date(study.studyDate).toLocaleDateString('en-AU');
  const images = study.images ?? [];

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-0">
        <div className="flex items-center justify-between p-3 bg-muted/50 border-b">
          <div className="flex items-center gap-2">
            <Badge variant="outline">{modalityLabel}</Badge>
            <span className="text-sm font-medium">{date}</span>
          </div>
          <span className="text-xs text-muted-foreground">{images.length} image{images.length !== 1 ? 's' : ''}</span>
        </div>

        <div className="grid gap-2 p-3">
          {images.slice(0, 6).map((image) => (
            <ImageThumb key={image.id} image={image} onClick={() => onImageClick(image)} />
          ))}
          {images.length > 6 && (
            <div className="text-center text-xs text-muted-foreground py-2">
              +{images.length - 6} more
            </div>
          )}
        </div>

        {images.length > 0 && (
          <div className="flex items-center justify-end gap-1 p-3 border-t bg-muted/30">
            {images.map((image) => (
              <Button
                key={image.id}
                variant="ghost"
                size="sm"
                onClick={() => onDownload(image.id, image.fileName)}
                disabled={downloadingId === image.id}
              >
                {downloadingId === image.id ? 'Downloading…' : <Download className="h-4 w-4" />}
              </Button>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

interface ImageThumbProps {
  image: ImageRow;
  onClick: () => void;
}

function ImageThumb({ image, onClick }: ImageThumbProps) {
  return (
    <button type="button" onClick={onClick} className="flex items-center gap-2 text-left w-full hover:bg-muted/30 rounded p-1.5 transition-colors">
      <div className="flex-shrink-0 w-10 h-10 bg-muted rounded flex items-center justify-center">
        <FileImage className="h-5 w-5 text-muted-foreground" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{image.fileName}</p>
        <p className="text-xs text-muted-foreground truncate">
          {image.toothNumber && `Tooth ${image.toothNumber}`} · {new Date(image.createdAt).toLocaleDateString('en-AU')}
        </p>
      </div>
    </button>
  );
}
