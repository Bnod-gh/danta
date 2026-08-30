import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { Clock, ListPlus, CalendarCheck, XCircle } from 'lucide-react';
import { Button } from '@danta/ui/button';
import { Badge } from '@danta/ui/badge';
import { Input } from '@danta/ui/input';
import { Label } from '@danta/ui/label';
import { Skeleton } from '@danta/ui/skeleton';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@danta/ui/table';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@danta/ui/dialog';
import { toast } from 'sonner';
import { apiDelete, apiGet, apiPost } from '../../lib/api/request';

interface WaitlistEntryVM {
  id: string;
  patientId: string;
  providerId?: string | null;
  chairId?: string | null;
  appointmentTypeId?: string | null;
  preferredStartTime: string;
  preferredEndTime: string;
  status: 'waiting' | 'booked' | 'cancelled';
  notes?: string | null;
}

const STATUS_VARIANTS: Record<WaitlistEntryVM['status'], 'default' | 'secondary' | 'destructive'> = {
  waiting: 'secondary',
  booked: 'default',
  cancelled: 'destructive',
};

function fmtWindow(startIso: string, endIso: string): string {
  const start = new Date(startIso);
  const end = new Date(endIso);
  const day = start.toLocaleDateString('en-AU', { weekday: 'short', day: 'numeric', month: 'short' });
  const time = (date: Date) => date.toLocaleTimeString('en-AU', { hour: '2-digit', minute: '2-digit' });
  return `${day} · ${time(start)}–${time(end)}`;
}

export function WaitlistPage() {
  const queryClient = useQueryClient();
  const [createOpen, setCreateOpen] = useState(false);

  const { data: entries, isLoading, error, refetch } = useQuery({
    queryKey: ['waitlist'],
    queryFn: () => apiGet<WaitlistEntryVM[]>('/waitlist'),
  });

  const patientsQuery = useQuery({
    queryKey: ['patients', 'for-waitlist'],
    queryFn: () => apiGet<{ data: Array<{ id: string; firstName: string; lastName: string; patientNumber?: string }>; total: number }>('/patients', { take: 200 }),
    enabled: createOpen,
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['waitlist'] });

  const cancelEntry = async (id: string) => {
    try {
      await apiDelete(`/waitlist/${id}`);
      toast.success('Waitlist entry cancelled');
      invalidate();
    } catch (error) {
      toast.error(error instanceof Error && error.message ? error.message : 'Could not cancel the entry');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-semibold tracking-tight"><Clock className="h-6 w-6" /> Waitlist</h1>
          <p className="text-muted-foreground">Patients waiting for earlier slots — cancellations raise matches automatically</p>
        </div>
        <NewEntryDialog open={createOpen} onOpenChange={setCreateOpen} patients={patientsQuery.data?.data ?? []} loadingPatients={patientsQuery.isLoading} onCreated={invalidate} />
      </div>

      {error ? (
        <div className="text-center py-12">
          <p className="text-destructive mb-4">Failed to load the waitlist</p>
          <Button variant="outline" onClick={() => refetch()}>Retry</Button>
        </div>
      ) : (
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Patient window</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Preferences</TableHead>
                <TableHead>Notes</TableHead>
                <TableHead className="w-24 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell><Skeleton className="h-4 w-56" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-16 rounded-full" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-40" /></TableCell>
                    <TableCell />
                  </TableRow>
                ))
              ) : !entries || entries.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-12 text-muted-foreground">
                    Nobody is waiting — add an entry when a patient wants an earlier slot.
                  </TableCell>
                </TableRow>
              ) : (
                entries.map((entry) => (
                  <TableRow key={entry.id}>
                    <TableCell className="font-medium">{fmtWindow(entry.preferredStartTime, entry.preferredEndTime)}</TableCell>
                    <TableCell><Badge variant={STATUS_VARIANTS[entry.status]}>{entry.status}</Badge></TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {[entry.providerId && `provider set`, entry.chairId && `chair set`, entry.appointmentTypeId && `type set`].filter(Boolean).join(' · ') || 'Any'}
                    </TableCell>
                    <TableCell className="max-w-64 truncate text-sm text-muted-foreground">{entry.notes ?? '—'}</TableCell>
                    <TableCell className="text-right">
                      {entry.status === 'waiting' && (
                        <div className="flex justify-end gap-1">
                          <BookFromWaitlistButton entry={entry} onDone={invalidate} />
                          <Button variant="ghost" size="icon" aria-label="Cancel entry" onClick={() => void cancelEntry(entry.id)}>
                            <XCircle className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}

function NewEntryDialog({ open, onOpenChange, patients, loadingPatients, onCreated }: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  patients: Array<{ id: string; firstName: string; lastName: string; patientNumber?: string }>;
  loadingPatients: boolean;
  onCreated: () => void;
}) {
  const [patientId, setPatientId] = useState('');
  const [date, setDate] = useState('');
  const [fromTime, setFromTime] = useState('');
  const [toTime, setToTime] = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    if (!patientId || !date || !fromTime || !toTime) {
      toast.error('Patient, date and both times are required');
      return;
    }
    if (fromTime >= toTime) {
      toast.error('The start time must be before the end time');
      return;
    }
    setSaving(true);
    try {
      await apiPost('/waitlist', {
        patientId,
        preferredStartTime: new Date(`${date}T${fromTime}:00`).toISOString(),
        preferredEndTime: new Date(`${date}T${toTime}:00`).toISOString(),
        ...(notes.trim() ? { notes: notes.trim() } : {}),
      });
      toast.success('Added to the waitlist');
      onCreated();
      onOpenChange(false);
      setPatientId(''); setDate(''); setFromTime(''); setToTime(''); setNotes('');
    } catch (error) {
      toast.error(error instanceof Error && error.message ? error.message : 'Could not add the entry');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button><ListPlus className="h-4 w-4 mr-2" /> Add to waitlist</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New waitlist entry</DialogTitle>
        </DialogHeader>
        {loadingPatients ? (
          <Skeleton className="h-10 w-full" />
        ) : (
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2 space-y-1.5">
              <Label htmlFor="wl-patient">Patient</Label>
              <select id="wl-patient" value={patientId} onChange={(e) => setPatientId(e.target.value)} className="h-10 w-full px-3 border rounded-md text-sm bg-background">
                <option value="">Select a patient…</option>
                {patients.map((patient) => (
                  <option key={patient.id} value={patient.id}>
                    {patient.firstName} {patient.lastName}{patient.patientNumber ? ` (${patient.patientNumber})` : ''}
                  </option>
                ))}
              </select>
            </div>
            <div className="col-span-2 space-y-1.5">
              <Label htmlFor="wl-date">Preferred date</Label>
              <Input id="wl-date" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="wl-from">Earliest time</Label>
              <Input id="wl-from" type="time" value={fromTime} onChange={(e) => setFromTime(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="wl-to">Latest time</Label>
              <Input id="wl-to" type="time" value={toTime} onChange={(e) => setToTime(e.target.value)} />
            </div>
            <div className="col-span-2 space-y-1.5">
              <Label htmlFor="wl-notes">Notes</Label>
              <Input id="wl-notes" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Optional context for reception" />
            </div>
          </div>
        )}
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>Cancel</Button>
          <Button onClick={submit} disabled={saving}>{saving ? 'Adding…' : 'Add entry'}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/** Books the freed-slot suggestion through POST /waitlist/:id/book. */
function BookFromWaitlistButton({ entry, onDone }: { entry: WaitlistEntryVM; onDone: () => void }) {
  const [saving, setSaving] = useState(false);
  // The book endpoint requires provider+chair and a concrete slot; reception
  // completes those in the booking flow. Here we surface a shortcut that books
  // the suggested slot with the entry's own preferences.
  const book = async () => {
    setSaving(true);
    try {
      await apiPost(`/waitlist/${entry.id}/book`, {
        startTime: entry.preferredStartTime,
        endTime: new Date(new Date(entry.preferredStartTime).getTime() + 30 * 60000).toISOString(),
      });
      toast.success('Appointment booked from waitlist');
      onDone();
    } catch (error) {
      toast.error(error instanceof Error && error.message ? error.message : 'Booking needs a provider and chair — assign them first');
    } finally {
      setSaving(false);
    }
  };
  return (
    <Button variant="outline" size="sm" onClick={() => void book()} disabled={saving}>
      <CalendarCheck className="h-3.5 w-3.5 mr-1" /> Book
    </Button>
  );
}
