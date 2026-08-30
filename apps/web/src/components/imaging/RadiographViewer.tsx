import { useCallback, useEffect, useRef, useState } from 'react';
import { Button } from '@danta/ui/button';
import { Input } from '@danta/ui/input';
import { Label } from '@danta/ui/label';
import { Badge } from '@danta/ui/badge';
import { Skeleton } from '@danta/ui/skeleton';
import { cn } from '@danta/ui/utils';
import { Crosshair, Maximize2, Minus, Plus, RotateCcw, Ruler } from 'lucide-react';
import { downloadImageOriginal } from '../../lib/api/imaging';
import { toast } from 'sonner';

type Tool = 'pan' | 'ruler';

interface Measurement {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

interface ViewState {
  scale: number;
  offsetX: number;
  offsetY: number;
  brightness: number;
  contrast: number;
  invert: boolean;
}

const DEFAULT_VIEW: ViewState = { scale: 1, offsetX: 0, offsetY: 0, brightness: 100, contrast: 100, invert: false };

export function RadiographViewer({ imageId, fileName }: { imageId: string; fileName?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);
  const viewRef = useRef<ViewState>({ ...DEFAULT_VIEW });
  const measurementsRef = useRef<Measurement[]>([]);
  const dragRef = useRef<{ startX: number; startY: number; baseX: number; baseY: number } | null>(null);
  const rulerRef = useRef<Measurement | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tool, setTool] = useState<Tool>('pan');
  const [view, setView] = useState<ViewState>({ ...DEFAULT_VIEW });
  const [pxPerMm, setPxPerMm] = useState<number | null>(null);
  const [calibrating, setCalibrating] = useState(false);
  const [calibrationValue, setCalibrationValue] = useState('');
  const [renderTick, setRenderTick] = useState(0);

  const syncView = useCallback((next: Partial<ViewState>) => {
    viewRef.current = { ...viewRef.current, ...next };
    setView({ ...viewRef.current });
  }, []);

  const redraw = useCallback(() => {
    const canvas = canvasRef.current;
    const image = imageRef.current;
    if (!canvas || !image) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const v = viewRef.current;
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.filter = `brightness(${v.brightness}%) contrast(${v.contrast}%) ${v.invert ? 'invert(1)' : ''}`;
    ctx.imageSmoothingEnabled = true;
    const w = image.naturalWidth * v.scale;
    const h = image.naturalHeight * v.scale;
    ctx.drawImage(image, canvas.width / 2 - w / 2 + v.offsetX, canvas.height / 2 - h / 2 + v.offsetY, w, h);
    ctx.filter = 'none';

    const allLines = [...measurementsRef.current];
    if (rulerRef.current) allLines.push(rulerRef.current);
    ctx.strokeStyle = '#22d3ee';
    ctx.lineWidth = Math.max(1.5, 2 / v.scale);
    ctx.font = `${Math.max(12, 14 / v.scale)}px ui-sans-serif, system-ui`;
    for (const line of allLines) {
      const x1 = canvas.width / 2 - w / 2 + v.offsetX + line.x1 * v.scale;
      const y1 = canvas.height / 2 - h / 2 + v.offsetY + line.y1 * v.scale;
      const x2 = canvas.width / 2 - w / 2 + v.offsetX + line.x2 * v.scale;
      const y2 = canvas.height / 2 - h / 2 + v.offsetY + line.y2 * v.scale;
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();
      const px = Math.hypot(line.x2 - line.x1, line.y2 - line.y1) * v.scale;
      const label = pxPerMm ? `${(px / pxPerMm).toFixed(1)} mm` : `${Math.round(px)} px`;
      ctx.fillStyle = '#22d3ee';
      ctx.fillText(label, (x1 + x2) / 2 + 6, (y1 + y2) / 2 - 6);
      ctx.fillStyle = '#f97316';
      ctx.fillRect(x1 - 3, y1 - 3, 6, 6);
      ctx.fillRect(x2 - 3, y2 - 3, 6, 6);
    }
    ctx.restore();
  }, [pxPerMm]);

  useEffect(() => {
    if (!open && !imageId) return;
    let cancelled = false;
    let objectUrl: string | null = null;
    setLoading(true);
    setError(null);
    viewRef.current = { ...DEFAULT_VIEW };
    measurementsRef.current = [];
    rulerRef.current = null;
    setView({ ...DEFAULT_VIEW });
    setPxPerMm(null);

    downloadImageOriginal(imageId)
      .then(async (blob) => {
        if (cancelled) return;
        objectUrl = URL.createObjectURL(blob);
        const image = new Image();
        image.onload = () => {
          if (cancelled) return;
          imageRef.current = image;
          const canvas = canvasRef.current;
          if (canvas && image.naturalWidth > 0) {
            const containerMax = 860;
            const fitScale = Math.min(containerMax / image.naturalWidth, 560 / image.naturalHeight, 1);
            canvas.width = Math.round(image.naturalWidth * fitScale);
            canvas.height = Math.round(image.naturalHeight * fitScale);
          }
          setLoading(false);
          requestAnimationFrame(() => redraw());
        };
        image.onerror = () => {
          if (!cancelled) {
            setLoading(false);
            setError('Unsupported or corrupt image data');
          }
        };
        image.src = objectUrl;
      })
      .catch(() => {
        if (!cancelled) {
          setLoading(false);
          setError('Failed to load image');
        }
      });

    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [imageId, redraw]);

  useEffect(() => {
    redraw();
  }, [redraw, renderTick, view]);

  const toCanvasCoords = (event: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    return { x: ((event.clientX - rect.left) / rect.width) * event.currentTarget.width, y: ((event.clientY - rect.top) / rect.height) * event.currentTarget.height };
  };

  const handleWheel = (event: React.WheelEvent<HTMLCanvasElement>) => {
    event.preventDefault();
    const factor = event.deltaY < 0 ? 1.12 : 0.9;
    syncView({ scale: Math.min(8, Math.max(0.2, viewRef.current.scale * factor)) });
  };

  const handleMouseDown = (event: React.MouseEvent<HTMLCanvasElement>) => {
    const point = toCanvasCoords(event);
    if (tool === 'ruler') {
      rulerRef.current = { x1: point.x / viewRef.current.scale, y1: point.y / viewRef.current.scale, x2: point.x / viewRef.current.scale, y2: point.y / viewRef.current.scale };
      return;
    }
    dragRef.current = { startX: event.clientX, startY: event.clientY, baseX: viewRef.current.offsetX, baseY: viewRef.current.offsetY };
  };

  const handleMouseMove = (event: React.MouseEvent<HTMLCanvasElement>) => {
    if (tool === 'ruler' && rulerRef.current) {
      const point = toCanvasCoords(event);
      rulerRef.current.x2 = point.x / viewRef.current.scale;
      rulerRef.current.y2 = point.y / viewRef.current.scale;
      redraw();
      return;
    }
    const drag = dragRef.current;
    if (drag) {
      syncView({ offsetX: drag.baseX + (event.clientX - drag.startX), offsetY: drag.baseY + (event.clientY - drag.startY) });
    }
  };

  const handleMouseUp = () => {
    if (tool === 'ruler' && rulerRef.current) {
      const lengthPxSource = Math.hypot(rulerRef.current.x2 - rulerRef.current.x1, rulerRef.current.y2 - rulerRef.current.y1);
      if (lengthPxSource > 4) {
        measurementsRef.current.push(rulerRef.current);
        if (!pxPerMm && !calibrating) setCalibrating(true);
      }
      rulerRef.current = null;
      setRenderTick((tick) => tick + 1);
    }
    dragRef.current = null;
  };

  const applyCalibration = () => {
    const measuredMm = Number(calibrationValue);
    if (!Number.isFinite(measuredMm) || measuredMm <= 0 || measurementsRef.current.length === 0) {
      toast.error('Enter the real-world length in mm');
      return;
    }
    const lastLine = measurementsRef.current[measurementsRef.current.length - 1];
    const measuredPx = Math.hypot(lastLine.x2 - lastLine.x1, lastLine.y2 - lastLine.y1);
    setPxPerMm(measuredPx / measuredMm);
    setCalibrating(false);
    setCalibrationValue('');
    toast.success(`Calibrated — ${measuredMm} mm reference applied`);
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <Button variant={tool === 'pan' ? 'default' : 'outline'} size="sm" onClick={() => setTool('pan')} title="Pan (drag)">
          <Maximize2 className="h-3.5 w-3.5 mr-1" /> Pan
        </Button>
        <Button variant={tool === 'ruler' ? 'default' : 'outline'} size="sm" onClick={() => setTool(tool === 'ruler' ? 'pan' : 'ruler')} title="Measure">
          <Ruler className="h-3.5 w-3.5 mr-1" /> Measure
        </Button>
        <span className="flex items-center gap-1 text-xs text-muted-foreground">
          <Minus className="h-3 w-3" />
          <Input
            type="range" min={20} max={400} value={view.scale * 25}
            onChange={(event) => syncView({ scale: Number(event.target.value) / 25 })}
            className="h-6 w-24 p-0"
            aria-label="Zoom"
          />
          <Plus className="h-3 w-3" />
          {Math.round(view.scale * 100)}%
        </span>
        <span className="flex items-center gap-1 text-xs text-muted-foreground">
          Brightness
          <input type="range" min={30} max={220} value={view.brightness} onChange={(event) => syncView({ brightness: Number(event.target.value) })} className="w-24" aria-label="Brightness" />
        </span>
        <span className="flex items-center gap-1 text-xs text-muted-foreground">
          Contrast
          <input type="range" min={30} max={260} value={view.contrast} onChange={(event) => syncView({ contrast: Number(event.target.value) })} className="w-24" aria-label="Contrast" />
        </span>
        <Button variant={view.invert ? 'default' : 'outline'} size="sm" onClick={() => syncView({ invert: !view.invert })}>
          Invert
        </Button>
        <Button variant="ghost" size="sm" onClick={() => { viewRef.current = { ...DEFAULT_VIEW }; measurementsRef.current = []; setView({ ...DEFAULT_VIEW }); setRenderTick((tick) => tick + 1); }} title="Reset view and clear measurements">
          <RotateCcw className="h-3.5 w-3.5 mr-1" /> Reset
        </Button>
        {pxPerMm && <Badge variant="secondary">{(1 / pxPerMm).toFixed(2)} px/mm</Badge>}
      </div>

      {calibrating && (
        <div className="flex items-end gap-2 rounded-md border border-cyan-500/40 bg-cyan-500/5 p-2">
          <div className="space-y-0.5 flex-1">
            <Label htmlFor="viewer-calibration" className="text-xs">Calibrate — enter the real length of your last measurement (mm)</Label>
            <Input id="viewer-calibration" type="number" min={0.1} step={0.1} value={calibrationValue} onChange={(event) => setCalibrationValue(event.target.value)} placeholder="e.g. 18" className="h-8" />
          </div>
          <Button size="sm" onClick={applyCalibration}>Apply</Button>
          <Button size="sm" variant="ghost" onClick={() => setCalibrating(false)}>Skip</Button>
        </div>
      )}

      <div className={cn('relative overflow-hidden rounded-lg border bg-black', tool === 'ruler' ? 'cursor-crosshair' : 'cursor-grab active:cursor-grabbing')}>
        {loading && <Skeleton className="absolute inset-0 m-auto h-64 w-full max-w-xl" />}
        {error && (
          <div className="p-10 text-center text-sm text-destructive">{error}</div>
        )}
        <canvas
          ref={canvasRef}
          width={860}
          height={560}
          className={cn('block max-h-[70vh] w-full', loading && 'invisible')}
          onWheel={handleWheel}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          data-testid="radiograph-canvas"
        />
        {!loading && !error && (
          <p className="pointer-events-none absolute bottom-2 right-3 text-[10px] text-white/50">
            {fileName ?? imageId.slice(0, 8)} · scroll to zoom · drag to pan{tool === 'ruler' ? ' · click-drag to measure' : ''}
          </p>
        )}
        {!loading && !error && (
          <Crosshair className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-white/40" />
        )}
      </div>
      <p className="text-xs text-muted-foreground">
        Measurements: {measurementsRef.current.length}{pxPerMm ? ' · calibrated' : ' · uncalibrated (px) — draw a line of known length to calibrate in mm'}
      </p>
    </div>
  );
}
