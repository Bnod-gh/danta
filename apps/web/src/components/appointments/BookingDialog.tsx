import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
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
import type { AppointmentType, Chair, Patient, Provider } from '@danta/schemas';
import { apiGet } from '../../lib/api/request';
import { createAppointment } from '../../lib/api/appointments';
import { toast } from 'sonner';

function toDateInputValue(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

interface BookingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultDate?: Date;
  defaultPatientId?: string;
  defaultProviderId?: string;
  defaultChairId?: string;
  defaultStartTime?: string;
  onBooked?: () => void;
}

export function BookingDialog({ open, onOpenChange, defaultDate, defaultPatientId, defaultProviderId, defaultChairId, defaultStartTime, onBooked }: BookingDialogProps) {
  const queryClient = useQueryClient();
  const baseDate = defaultDate ?? new Date();

  const [patientSearch, setPatientSearch] = useState('');
  const [patientId, setPatientId] = useState(defaultPatientId ?? '');
  const [providerId, setProviderId] = useState(defaultProviderId ?? '');
  const [chairId, setChairId] = useState(defaultChairId ?? '');
  const [typeId, setTypeId] = useState('');
  const [date, setDate] = useState(toDateInputValue(baseDate));
  const [startTime, setStartTime] = useState(defaultStartTime ?? '09:00');
  const [duration, setDuration] = useState('30');
  const [price, setPrice] = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  const patientsQuery = useQuery({
    queryKey: ['patients', 'for-booking', patientSearch],
    queryFn: () => apiGet<{ data: Patient[] }>('/patients', { search: patientSearch || undefined, take: 20 }),
    enabled: open,
  });

  const providersQuery = useQuery({
    queryKey: ['providers', 'for-booking'],
    queryFn: () => apiGet<Provider[]>('/providers'),
    enabled: open,
  });

  const chairsQuery = useQuery({
    queryKey: ['chairs', 'for-booking'],
    queryFn: () => apiGet<Chair[]>('/chairs'),
    enabled: open,
  });

  const typesQuery = useQuery({
    queryKey: ['appointment-types', 'for-booking'],
    queryFn: () => apiGet<Array<AppointmentType & { isActive: boolean }>>('/appointment-types'),
    enabled: open,
  });

  const selectedType = useMemo(
    () => (typesQuery.data ?? []).find((type) => type.id === typeId),
    [typesQuery.data, typeId],
  );

  const handleTypeChange = (value: string) => {
    setTypeId(value);
    const type = (typesQuery.data ?? []).find((candidate) => candidate.id === value);
    if (type?.duration) setDuration(String(type.duration));
  };

  const reset = () => {
    setPatientSearch('');
    setPatientId(defaultPatientId ?? '');
    setProviderId(defaultProviderId ?? '');
    setChairId(defaultChairId ?? '');
    setTypeId('');
    setStartTime(defaultStartTime ?? '09:00');
    setDuration('30');
    setPrice('');
    setNotes('');
  };

  const filteredPatients = (patientsQuery.data?.data ?? []).filter((patient) =>
    `${patient.firstName} ${patient.lastName} ${patient.patientNumber}`.toLowerCase().includes(patientSearch.toLowerCase()),
  );

  const handleBook = async () => {
    if (!patientId || !providerId || !chairId || !typeId || !date || !startTime) {
      toast.error('Complete patient, provider, chair, procedure and time');
      return;
    }
    const minutes = Number(duration);
    if (!Number.isFinite(minutes) || minutes <= 0) {
      toast.error('Duration must be a positive number of minutes');
      return;
    }

    const start = new Date(`${date}T${startTime}`);
    if (Number.isNaN(start.getTime())) {
      toast.error('Invalid date or start time');
      return;
    }
    const end = new Date(start.getTime() + minutes * 60_000);
    const parsedPrice = price.trim() ? Number(price) : undefined;
    if (parsedPrice != null && (!Number.isFinite(parsedPrice) || parsedPrice < 0)) {
      toast.error('Price must be a non-negative number');
      return;
    }

    setSaving(true);
    try {
      await createAppointment({
        patientId,
        providerId,
        chairId,
        appointmentTypeId: typeId,
        startTime: start,
        endTime: end,
        status: 'scheduled',
        ...(parsedPrice != null ? { scheduledPrice: parsedPrice } : {}),
        ...(notes.trim() ? { notes: notes.trim() } : {}),
      });
      toast.success(`Appointment booked for ${start.toLocaleString('en-AU', { dateStyle: 'medium', timeStyle: 'short' })}`);
      await queryClient.invalidateQueries({ queryKey: ['schedule'] });
      await queryClient.invalidateQueries({ queryKey: ['appointments'] });
      await queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      onOpenChange(false);
      reset();
      onBooked?.();
    } catch (error) {
      const message = error instanceof Error ? error.message : '';
      if (/conflict|overlap/i.test(message)) {
        toast.error('That slot conflicts with an existing appointment for this provider or chair');
      } else {
        toast.error('Failed to book appointment');
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Book appointment</DialogTitle>
          <DialogDescription>Schedule a procedure into an operatory chair. Conflicts with existing bookings are rejected.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="bk-patient-search">Find patient</Label>
            <Input
              id="bk-patient-search"
              placeholder="Search by name or number…"
              value={patientSearch}
              onChange={(event) => setPatientSearch(event.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="bk-patient">Patient</Label>
            <Select id="bk-patient" value={patientId} onChange={(event) => setPatientId(event.target.value)}>
              <option value="">Select patient…</option>
              {filteredPatients.map((patient) => (
                <option key={patient.id} value={patient.id}>
                  {patient.firstName} {patient.lastName} ({patient.patientNumber})
                </option>
              ))}
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="bk-provider">Practitioner</Label>
              <Select id="bk-provider" value={providerId} onChange={(event) => setProviderId(event.target.value)}>
                <option value="">Select…</option>
                {(providersQuery.data ?? []).map((provider) => (
                  <option key={provider.id} value={provider.id}>Dr {provider.firstName} {provider.lastName}</option>
                ))}
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="bk-chair">Operatory chair</Label>
              <Select id="bk-chair" value={chairId} onChange={(event) => setChairId(event.target.value)}>
                <option value="">Select…</option>
                {(chairsQuery.data ?? []).map((chair) => (
                  <option key={chair.id} value={chair.id}>{chair.name}</option>
                ))}
              </Select>
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="bk-type">Procedure</Label>
            <Select id="bk-type" value={typeId} onChange={(event) => handleTypeChange(event.target.value)}>
              <option value="">Select procedure…</option>
              {(typesQuery.data ?? []).map((type) => (
                <option key={type.id} value={type.id}>
                  {type.name}{type.code ? ` · ${type.code}` : ''} · {type.duration}min
                </option>
              ))}
            </Select>
            {selectedType?.code && (
              <p className="text-xs text-muted-foreground">Clinical code {selectedType.code}</p>
            )}
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="bk-date">Date</Label>
              <Input id="bk-date" type="date" value={date} onChange={(event) => setDate(event.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="bk-start">Start</Label>
              <Input id="bk-start" type="time" value={startTime} onChange={(event) => setStartTime(event.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="bk-duration">Duration (min)</Label>
              <Input id="bk-duration" type="number" min={5} step={5} value={duration} onChange={(event) => setDuration(event.target.value)} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="bk-price">Scheduled price (AUD)</Label>
              <Input id="bk-price" type="number" min={0} step={0.01} value={price} onChange={(event) => setPrice(event.target.value)} placeholder="Optional" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="bk-notes">Notes</Label>
              <Input id="bk-notes" value={notes} onChange={(event) => setNotes(event.target.value)} placeholder="Optional" />
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>Cancel</Button>
          <Button onClick={handleBook} disabled={saving}>{saving ? 'Booking…' : 'Book appointment'}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

