import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { Clock, Search } from 'lucide-react';
import { Button } from '@danta/ui/button';
import { Input } from '@danta/ui/input';
import { Label } from '@danta/ui/label';
import { Skeleton } from '@danta/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@danta/ui/dialog';
import { Select } from '@danta/ui/select';
import type { Provider } from '@danta/schemas';
import { apiGet } from '../../lib/api/request';
import { getFreeSlots } from '../../lib/api/schedules';

const DURATIONS = [15, 30, 45, 60, 90, 120];

interface FreeSlotsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultProviderId?: string;
  defaultDate?: Date;
  onPickSlot: (date: Date, startTime: string) => void;
}

export function FreeSlotsDialog({ open, onOpenChange, defaultProviderId, defaultDate, onPickSlot }: FreeSlotsDialogProps) {
  const baseDate = defaultDate ?? new Date();
  const toDateInput = (date: Date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

  const [providerId, setProviderId] = useState(defaultProviderId ?? '');
  const [dateInput, setDateInput] = useState(toDateInput(baseDate));
  const [durationMin, setDurationMin] = useState(30);
  const [submitted, setSubmitted] = useState<{ providerId: string; date: string; durationMin: number } | null>(null);

  const providersQuery = useQuery({
    queryKey: ['providers', 'for-slots'],
    queryFn: () => apiGet<Provider[]>('/providers'),
    enabled: open,
  });

  const effectiveProviderId = providerId || defaultProviderId || providersQuery.data?.[0]?.id || '';

  const slotsQuery = useQuery({
    queryKey: ['free-slots', submitted?.providerId, submitted?.date, submitted?.durationMin],
    queryFn: () => getFreeSlots({ providerId: submitted!.providerId, date: submitted!.date, durationMin: submitted!.durationMin }),
    enabled: open && !!submitted,
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><Clock className="h-4 w-4" /> Find free slots</DialogTitle>
          <DialogDescription>Search openings from practitioner shift templates, minus time off and existing bookings.</DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-3 gap-3 items-end">
          <div className="space-y-1.5 col-span-3 sm:col-span-1">
            <Label htmlFor="slots-provider">Practitioner</Label>
            <Select id="slots-provider" value={effectiveProviderId} onChange={(event) => setProviderId(event.target.value)}>
              {(providersQuery.data ?? []).map((provider) => (
                <option key={provider.id} value={provider.id}>Dr {provider.firstName} {provider.lastName}</option>
              ))}
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="slots-date">Date</Label>
            <Input id="slots-date" type="date" value={dateInput} onChange={(event) => setDateInput(event.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="slots-duration">Duration</Label>
            <Select id="slots-duration" value={String(durationMin)} onChange={(event) => setDurationMin(Number(event.target.value))}>
              {DURATIONS.map((minutes) => <option key={minutes} value={minutes}>{minutes} min</option>)}
            </Select>
          </div>
        </div>

        <Button
          onClick={() => setSubmitted(effectiveProviderId ? { providerId: effectiveProviderId, date: dateInput, durationMin } : null)}
          disabled={!effectiveProviderId}
        >
          <Search className="h-4 w-4 mr-2" /> Search
        </Button>

        <div className="min-h-40 space-y-2" aria-live="polite">
          {!submitted && <p className="py-8 text-center text-sm text-muted-foreground">Choose a practitioner and date, then search.</p>}
          {submitted && slotsQuery.isLoading && (
            <div className="grid grid-cols-3 gap-2">{Array.from({ length: 6 }).map((_, index) => <Skeleton key={index} className="h-9 w-full" />)}</div>
          )}
          {submitted && slotsQuery.data && slotsQuery.data.slots.length === 0 && (
            <p className="py-8 text-center text-sm text-muted-foreground">No free slots — the practitioner may be off or fully booked that day.</p>
          )}
          {submitted && slotsQuery.data && slotsQuery.data.slots.length > 0 && (
            <div className="grid grid-cols-3 gap-2 max-h-64 overflow-y-auto">
              {slotsQuery.data.slots.map((slot) => (
                <button
                  key={`${slot.startTime}-${slot.endTime}`}
                  className="rounded-md border px-2 py-1.5 text-sm hover:bg-accent hover:text-accent-foreground"
                  onClick={() => {
                    const [hours, minutes] = slot.startTime.split(':').map(Number);
                    const picked = new Date(`${submitted.date}T00:00:00`);
                    picked.setHours(hours, minutes, 0, 0);
                    onPickSlot(picked, slot.startTime);
                    onOpenChange(false);
                  }}
                >
                  {slot.startTime}
                </button>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
