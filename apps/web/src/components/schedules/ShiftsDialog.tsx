import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { Button } from '@danta/ui/button';
import { Input } from '@danta/ui/input';
import { Label } from '@danta/ui/label';
import { Badge } from '@danta/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@danta/ui/dialog';
import { Select } from '@danta/ui/select';
import type { Provider, ProviderShift, ScheduleOverride } from '@danta/schemas';
import { apiGet } from '../../lib/api/request';
import { createShift, deleteShift, createOverride, deleteOverride } from '../../lib/api/schedules';
import { toast } from 'sonner';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const JS_DAY_BY_NAME = [1, 2, 3, 4, 5, 6, 0];

interface ShiftsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ShiftsDialog({ open, onOpenChange }: ShiftsDialogProps) {
  const queryClient = useQueryClient();
  const [providerId, setProviderId] = useState('');
  const [dayName, setDayName] = useState('Monday');
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('17:00');
  const [saving, setSaving] = useState(false);

  const providersQuery = useQuery({
    queryKey: ['providers', 'for-schedule'],
    queryFn: () => apiGet<Provider[]>('/providers'),
    enabled: open,
  });

  const activeProviderId = providerId || providersQuery.data?.[0]?.id || '';

  const shiftsQuery = useQuery({
    queryKey: ['schedule-shifts', activeProviderId],
    queryFn: () => apiGet<ProviderShift[]>('/schedules/shifts', { providerId: activeProviderId || undefined }),
    enabled: open && !!activeProviderId,
  });

  const overridesQuery = useQuery({
    queryKey: ['schedule-overrides', activeProviderId],
    queryFn: () => apiGet<ScheduleOverride[]>('/schedules/overrides', { providerId: activeProviderId || undefined }),
    enabled: open && !!activeProviderId,
  });

  const invalidate = async () => {
    await queryClient.invalidateQueries({ queryKey: ['schedule-shifts'] });
    await queryClient.invalidateQueries({ queryKey: ['schedule-overrides'] });
    await queryClient.invalidateQueries({ queryKey: ['free-slots'] });
  };

  const handleAddShift = async () => {
    if (!activeProviderId) return toast.error('Select a practitioner');
    if (startTime >= endTime) return toast.error('Start time must be before end time');
    setSaving(true);
    try {
      await createShift({
        providerId: activeProviderId,
        dayOfWeek: JS_DAY_BY_NAME[DAYS.indexOf(dayName)],
        startTime,
        endTime,
      });
      toast.success(`${dayName} shift added`);
      await invalidate();
      shiftsQuery.refetch();
      overridesQuery.refetch();
    } catch (error) {
      const message = error instanceof Error ? error.message : '';
      toast.error(/overlap/i.test(message) ? 'This shift overlaps an existing shift' : 'Failed to add shift');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteShift = async (id: string) => {
    try {
      await deleteShift(id);
      toast.success('Shift removed');
      await invalidate();
      shiftsQuery.refetch();
    } catch {
      toast.error('Failed to remove shift');
    }
  };

  const handleAddTimeOff = async () => {
    if (!activeProviderId) return toast.error('Select a practitioner');
    const dateInput = (document.getElementById('override-date') as HTMLInputElement | null)?.value;
    if (!dateInput) return toast.error('Pick a date');
    setSaving(true);
    try {
      await createOverride({
        providerId: activeProviderId,
        date: new Date(`${dateInput}T00:00:00`),
        type: 'time_off',
        isFullDay: true,
      });
      toast.success('Time off added');
      await invalidate();
      overridesQuery.refetch();
    } catch {
      toast.error('Failed to add time off');
    } finally {
      setSaving(false);
    }
  };

  const handleAddCustomHours = async () => {
    if (!activeProviderId) return toast.error('Select a practitioner');
    const dateInput = (document.getElementById('custom-hours-date') as HTMLInputElement | null)?.value;
    if (!dateInput) return toast.error('Pick a date');
    if (startTime >= endTime) return toast.error('Start time must be before end time');
    setSaving(true);
    try {
      await createOverride({
        providerId: activeProviderId,
        date: new Date(`${dateInput}T00:00:00`),
        type: 'custom_hours',
        isFullDay: false,
        startTime,
        endTime,
      });
      toast.success('Custom hours set');
      await invalidate();
      overridesQuery.refetch();
    } catch {
      toast.error('Failed to set custom hours');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteOverride = async (id: string) => {
    try {
      await deleteOverride(id);
      toast.success('Override removed');
      await invalidate();
      overridesQuery.refetch();
    } catch {
      toast.error('Failed to remove override');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Practitioner schedules</DialogTitle>
          <DialogDescription>Weekly working template plus date-specific overrides. Free-slot search uses this data.</DialogDescription>
        </DialogHeader>

        <div className="space-y-1.5">
          <Label htmlFor="sched-provider">Practitioner</Label>
          <Select id="sched-provider" value={activeProviderId} onChange={(event) => setProviderId(event.target.value)}>
            {(providersQuery.data ?? []).map((provider) => (
              <option key={provider.id} value={provider.id}>Dr {provider.firstName} {provider.lastName}</option>
            ))}
          </Select>
        </div>

        <section className="space-y-2" aria-label="Weekly template">
          <h3 className="text-sm font-semibold">Weekly template</h3>
          <div className="grid grid-cols-4 gap-2 items-end">
            <div className="space-y-1.5 col-span-2">
              <Label htmlFor="shift-day">Day</Label>
              <Select id="shift-day" value={dayName} onChange={(event) => setDayName(event.target.value)}>
                {DAYS.map((name) => <option key={name} value={name}>{name}</option>)}
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="shift-start">From</Label>
              <Input id="shift-start" type="time" value={startTime} onChange={(event) => setStartTime(event.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="shift-end">To</Label>
              <Input id="shift-end" type="time" value={endTime} onChange={(event) => setEndTime(event.target.value)} />
            </div>
          </div>
          <Button size="sm" onClick={handleAddShift} disabled={saving}>
            <Plus className="h-3.5 w-3.5 mr-1" /> Add shift
          </Button>
          <div className="divide-y rounded-md border">
            {DAYS.map((name, index) => {
              const jsDay = JS_DAY_BY_NAME[index];
              const dayShifts = (shiftsQuery.data ?? []).filter((shift) => shift.dayOfWeek === jsDay);
              return (
                <div key={name} className="flex items-center gap-2 px-3 py-2 text-sm">
                  <span className="w-24 shrink-0 font-medium">{name}</span>
                  {dayShifts.length === 0 ? (
                    <span className="text-xs text-muted-foreground">Not working</span>
                  ) : (
                    dayShifts.map((shift) => (
                      <Badge key={shift.id} variant="secondary" className="gap-1">
                        {shift.startTime}–{shift.endTime}
                        <button onClick={() => handleDeleteShift(shift.id)} aria-label={`Remove ${name} ${shift.startTime} shift`} className="ml-0.5 hover:text-destructive">
                          ×
                        </button>
                      </Badge>
                    ))
                  )}
                </div>
              );
            })}
          </div>
        </section>

        <section className="grid gap-4 sm:grid-cols-2" aria-label="Overrides">
          <div className="space-y-2">
            <h3 className="text-sm font-semibold">Time off (full day)</h3>
            <Input id="override-date" type="date" />
            <Button size="sm" variant="outline" onClick={handleAddTimeOff} disabled={saving}>
              <Plus className="h-3.5 w-3.5 mr-1" /> Add time off
            </Button>
          </div>
          <div className="space-y-2">
            <h3 className="text-sm font-semibold">Custom hours for a day</h3>
            <Input id="custom-hours-date" type="date" />
            <div className="flex items-center gap-2 text-xs text-muted-foreground">Uses From / To times above as that day's hours</div>
            <Button size="sm" variant="outline" onClick={handleAddCustomHours} disabled={saving}>
              <Plus className="h-3.5 w-3.5 mr-1" /> Set custom hours
            </Button>
          </div>
        </section>

        {(overridesQuery.data ?? []).length > 0 && (
          <section className="space-y-1" aria-label="Upcoming overrides">
            <h3 className="text-sm font-semibold">Overrides on file</h3>
            {(overridesQuery.data ?? []).slice(0, 10).map((entry) => (
              <div key={entry.id} className="flex items-center justify-between rounded-md border px-3 py-1.5 text-xs">
                <span>
                  {new Date(entry.date).toLocaleDateString('en-AU')} ·{' '}
                  {entry.type === 'time_off'
                    ? entry.isFullDay ? 'Full-day time off' : `Off ${entry.startTime ?? ''}–${entry.endTime ?? ''}`
                    : `Working ${entry.startTime ?? ''}–${entry.endTime ?? ''}`}
                  {entry.reason ? ` · ${entry.reason}` : ''}
                </span>
                <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => handleDeleteOverride(entry.id)} aria-label="Remove override">
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            ))}
          </section>
        )}
      </DialogContent>
    </Dialog>
  );
}
