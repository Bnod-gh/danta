import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Camera, CheckCircle2, Video, X, Scissors } from 'lucide-react';
import { Button } from '@danta/ui/button';
import { Input } from '@danta/ui/input';
import { Label } from '@danta/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@danta/ui/dialog';
import {
  Select,
} from '@danta/ui/select';
import { cn } from '@danta/ui/utils';
import type { Patient, Provider } from '@danta/schemas';
import { apiGet } from '../../lib/api/request';
import { ensureOpenStudy, uploadImage, initiateTwainScan } from '../../lib/api/imaging';
import { toast } from 'sonner';

const MODALITY_OPTIONS = [
  { value: 'intraoral', label: 'Intraoral photo' },
  { value: 'bitewing', label: 'Bitewing' },
  { value: 'periapical', label: 'Periapical' },
  { value: 'panoramic', label: 'Panoramic (Pano)' },
];

export function CameraCaptureDialog({ open, onOpenChange, presetPatientId }: { open: boolean; onOpenChange: (open: boolean) => void; presetPatientId?: string }) {
  const queryClient = useQueryClient();
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const captureCanvasRef = useRef<HTMLCanvasElement>(null);

  const [patientSearch, setPatientSearch] = useState('');
  const [patientId, setPatientId] = useState(presetPatientId ?? '');
  const [providerId, setProviderId] = useState('');
  const [modality, setModality] = useState('intraoral');
  const [toothNumber, setToothNumber] = useState('');
  const [stage, setStage] = useState<'setup' | 'live'>('setup');
  const [frozen, setFrozen] = useState(false);
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [deviceId, setDeviceId] = useState<string | undefined>(undefined);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [lastCaptured, setLastCaptured] = useState<string | null>(null);

  const patientsQuery = useQuery({
    queryKey: ['patients', 'for-camera', patientSearch],
    queryFn: () => apiGet<{ data: Patient[] }>('/patients', { search: patientSearch || undefined, take: 20 }),
    enabled: open && stage === 'setup',
  });

  const providersQuery = useQuery({
    queryKey: ['providers', 'for-camera'],
    queryFn: () => apiGet<Provider[]>('/providers'),
    enabled: open && stage === 'setup',
  });

  const stopStream = useCallback(() => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
  }, []);

  const startStream = useCallback(async (preferredDeviceId?: string) => {
    setCameraError(null);
    try {
      streamRef.current?.getTracks().forEach((track) => track.stop());
      const stream = await navigator.mediaDevices.getUserMedia({
        video: preferredDeviceId ? { deviceId: { exact: preferredDeviceId } } : { facingMode: 'environment', width: { ideal: 1280 } },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play().catch(() => undefined);
      }
      const tracks = stream.getVideoTracks();
      setFrozen(false);
      if (devices.length === 0) {
        const all = await navigator.mediaDevices.enumerateDevices();
        setDevices(all.filter((device) => device.kind === 'videoinput'));
      }
      void tracks;
    } catch (error) {
      setCameraError(error instanceof Error ? error.message : 'Camera unavailable');
    }
  }, []);

  useEffect(() => {
    if (!open) {
      stopStream();
      setStage('setup');
      setFrozen(false);
      setLastCaptured(null);
      setPatientId(presetPatientId ?? '');
      setPatientSearch('');
      setToothNumber('');
      setCameraError(null);
    }
    return () => stopStream();
  }, [open, stopStream, presetPatientId]);

  const ensureStudy = async (): Promise<string> => {
    return ensureOpenStudy({
      patientId,
      modality,
      providerId: providerId || undefined,
      providerFallback: (providersQuery.data ?? [])[0]?.id,
      description: `Acquired via intraoral camera — ${new Date().toLocaleString('en-AU')}`,
    });
  };

  const captureFrame = useCallback(async (): Promise<Blob | null> => {
    const video = videoRef.current;
    if (!video || !video.videoWidth) return null;
    const canvas = captureCanvasRef.current ?? document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;
    ctx.drawImage(video, 0, 0);
    return new Promise((resolve) => canvas.toBlob((blob) => resolve(blob), 'image/jpeg', 0.92));
  }, []);

  const captureAndUpload = useCallback(async () => {
    if (uploading) return;
    setUploading(true);
    try {
      const blob = await captureFrame();
      if (!blob) {
        toast.error('No frame available to capture');
        return;
      }
      const studyId = await ensureStudy();
      const fileName = `intraoral-${Date.now()}.jpg`;
      await uploadImage(blob, { imagingStudyId: studyId, toothNumber: toothNumber.trim() || undefined, fileName });
      toast.success(toothNumber.trim() ? `Captured — tagged to tooth ${toothNumber.trim()}` : 'Captured and saved to the study');
      setLastCaptured(`${fileName} (${Math.round(blob.size / 1024)} KB)`);
      queryClient.invalidateQueries({ queryKey: ['imaging-images'] });
      queryClient.invalidateQueries({ queryKey: ['imaging-studies'] });
      queryClient.invalidateQueries({ queryKey: ['patient-workspace'] });
    } catch (error) {
      toast.error(error instanceof Error ? `Capture failed: ${error.message}` : 'Capture failed');
    } finally {
      setUploading(false);
    }
  }, [captureFrame, ensureStudy, queryClient, toothNumber, uploading]);

  useEffect(() => {
    if (!open || stage !== 'live') return;
    const handler = (event: KeyboardEvent) => {
      if (event.code !== 'Space' || (event.target as HTMLElement)?.tagName === 'INPUT') return;
      event.preventDefault();
      if (frozen) {
        void captureAndUpload();
        setFrozen(false);
      } else {
        setFrozen(true);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, stage, frozen, captureAndUpload]);

  const beginLive = async () => {
    if (!patientId) {
      toast.error('Select a patient first');
      return;
    }
    try {
      await ensureStudy();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to prepare imaging study');
      return;
    }
    setStage('live');
    await startStream(deviceId);
  };

  const startTwain = async () => {
    if (!patientId) {
      toast.error('Select a patient first');
      return;
    }
    try {
      const result = await initiateTwainScan({ patientId, modality, toothNumber: toothNumber.trim() || undefined });
      toast.success(result.message, {
        action: {
          label: 'Copy ID',
          onClick: () => navigator.clipboard.writeText(result.scanId),
        },
      });
      setLastCaptured(result.scanId);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'TWAIN scan failed to initiate');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Camera className="h-4 w-4" />
            Acquisition
          </DialogTitle>
          <DialogDescription>
            Live intraoral camera / webcam acquisition. Spacebar freezes the frame; pressing it again captures and files the shot.
          </DialogDescription>
        </DialogHeader>

        {stage === 'setup' && (
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="cam-patient-search">Find patient</Label>
              <Input id="cam-patient-search" placeholder="Search by name or number…" value={patientSearch} onChange={(event) => setPatientSearch(event.target.value)} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="cam-patient">Patient</Label>
                <Select id="cam-patient" value={patientId} onChange={(event) => setPatientId(event.target.value)}>
                  <option value="">Select patient…</option>
                  {(patientsQuery.data?.data ?? []).map((patient) => (
                    <option key={patient.id} value={patient.id}>{patient.firstName} {patient.lastName} ({patient.patientNumber})</option>
                  ))}
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="cam-provider">Practitioner</Label>
                <Select id="cam-provider" value={providerId} onChange={(event) => setProviderId(event.target.value)}>
                  <option value="">Auto-assign</option>
                  {(providersQuery.data ?? []).map((provider) => (
                    <option key={provider.id} value={provider.id}>Dr {provider.firstName} {provider.lastName}</option>
                  ))}
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="cam-modality">Image type</Label>
                <Select id="cam-modality" value={modality} onChange={(event) => setModality(event.target.value)}>
                  {MODALITY_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="cam-tooth">Tooth tag (optional)</Label>
                <Input id="cam-tooth" value={toothNumber} onChange={(event) => setToothNumber(event.target.value)} placeholder="e.g. 14 or FDI 24" />
              </div>
            </div>
          </div>
        )}

        {stage === 'live' && (
          <div className="space-y-3">
            <div className="relative overflow-hidden rounded-lg border bg-black">
              <video ref={videoRef} playsInline muted className={cn('block max-h-[46vh] w-full', frozen && 'opacity-90')} />
              {frozen && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                  <span className="rounded-full bg-white/90 px-3 py-1 text-xs font-semibold text-black">FROZEN — Spacebar to capture</span>
                </div>
              )}
              {!streamRef.current && !frozen && (
                <p className="p-10 text-center text-sm text-white/70">Starting camera…</p>
              )}
            </div>
            {cameraError && <p className="text-sm text-destructive">{cameraError}</p>}
            <div className="flex flex-wrap items-center gap-2">
              <Button size="sm" onClick={() => { setFrozen(true); }} disabled={frozen}>
                Freeze frame
              </Button>
              <Button size="sm" variant="outline" onClick={() => setFrozen(false)} disabled={!frozen}>
                Resume live
              </Button>
              <Button size="sm" onClick={() => void captureAndUpload()} disabled={uploading} className="gap-1.5">
                <CheckCircle2 className="h-4 w-4" />
                {uploading ? 'Uploading…' : 'Capture & file'}
              </Button>
              {(devices.length > 1) && (
                <Select aria-label="Camera device" value={deviceId ?? ''} onChange={(event) => setDeviceId(event.target.value || undefined)} className="h-8 w-auto text-xs">
                  <option value="">Default camera</option>
                  {devices.map((device, index) => (
                    <option key={device.deviceId || index} value={device.deviceId}>{device.label || `Camera ${index + 1}`}</option>
                  ))}
                </Select>
              )}
              {lastCaptured && (
                <span className="ml-auto inline-flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  Saved {lastCaptured}
                </span>
              )}
            </div>
            {toothNumber && <p className="text-xs text-muted-foreground">Tagging captures to tooth <span className="font-mono">{toothNumber}</span></p>}
          </div>
        )}

        <DialogFooter>
          {stage === 'setup' ? (
            <>
              <Button onClick={() => void beginLive()} disabled={!patientId} className="gap-1.5">
                <Video className="h-4 w-4" />
                Start camera
              </Button>
              <Button variant="secondary" onClick={() => void startTwain()} disabled={!patientId} className="gap-1.5">
                <Scissors className="h-4 w-4" />
                TWAIN Scanner
              </Button>
            </>
          ) : (
            <Button variant="outline" onClick={() => { stopStream(); setStage('setup'); }} className="gap-1.5">
              <X className="h-4 w-4" />
              Stop camera
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
