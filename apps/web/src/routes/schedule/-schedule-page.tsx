import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, Clock, Plus, Settings2 } from 'lucide-react';
import { Button } from '@danta/ui/button';
import { Badge, badgeVariants } from '@danta/ui/badge';
import { Skeleton } from '@danta/ui/skeleton';
import { Select } from '@danta/ui/select';
import { cn } from '@danta/ui/utils';
import { apiGet } from '../../lib/api/request';
import { getChairsForBooking, getProviders, type AppointmentListItem } from '../../lib/api/appointments';
import { BookingDialog } from '../../components/appointments/BookingDialog';
import { ShiftsDialog } from '../../components/schedules/ShiftsDialog';
import { FreeSlotsDialog } from '../../components/schedules/FreeSlotsDialog';
import { rescheduleAppointment } from '../../lib/api/schedules';
import { formatCurrency } from '../../lib/format';
import { toast } from 'sonner';
import type { Chair, Provider } from '@danta/schemas';

type ViewMode = 'day' | 'week' | 'month';

const STATUS_COLORS: Record<string, string> = {
  scheduled: 'bg-blue-100 text-blue-800 border-blue-200',
  confirmed: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  checked_in: 'bg-violet-100 text-violet-800 border-violet-200',
  in_progress: 'bg-amber-100 text-amber-800 border-amber-200',
  completed: 'bg-slate-100 text-slate-800 border-slate-200',
  cancelled: 'bg-red-100 text-red-800 border-red-200',
  no_show: 'bg-rose-100 text-rose-800 border-rose-200',
};

const STATUS_LABELS: Record<string, string> = {
  scheduled: 'Scheduled',
  confirmed: 'Confirmed',
  checked_in: 'Checked In',
  in_progress: 'In Chair',
  completed: 'Completed',
  cancelled: 'Cancelled',
  no_show: 'No Show',
};

const MOVEABLE_STATUSES = new Set(['scheduled', 'confirmed', 'checked_in', 'in_progress']);

function isMoveable(status: string) {
  return MOVEABLE_STATUSES.has(status);
}

const ROW_HEIGHT = 44;
const SLOT_MINUTES = 30;
const SNAP_MINUTES = 15;
const GRID_START_HOUR = 7;
const GRID_END_HOUR = 20;

function isSameDay(d1: Date, d2: Date) {
  return d1.getFullYear() === d2.getFullYear() && d1.getMonth() === d2.getMonth() && d1.getDate() === d2.getDate();
}

function addDays(date: Date, days: number) {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

function startOfWeek(date: Date) {
  const result = new Date(date);
  const day = result.getDay();
  const diff = result.getDate() - day + (day === 0 ? -6 : 1);
  result.setDate(diff);
  result.setHours(0, 0, 0, 0);
  return result;
}

function toDateParam(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function formatTime(date: Date) {
  return new Intl.DateTimeFormat('en-AU', { hour: 'numeric', minute: '2-digit' }).format(date);
}

function formatDateShort(date: Date) {
  return new Intl.DateTimeFormat('en-AU', { month: 'short', day: 'numeric' }).format(date);
}

function formatDateLong(date: Date) {
  return new Intl.DateTimeFormat('en-AU', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' }).format(date);
}

function formatDayName(date: Date) {
  return new Intl.DateTimeFormat('en-AU', { weekday: 'short' }).format(date);
}

function minutesToLabel(totalMinutes: number) {
  const hours = Math.floor(totalMinutes / 60) % 24;
  const minutes = totalMinutes % 60;
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
}

export function SchedulePage() {
  const [viewMode, setViewMode] = useState<ViewMode>('day');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [providerFilter, setProviderFilter] = useState('');
  const [bookingOpen, setBookingOpen] = useState(false);
  const [bookingDefaults, setBookingDefaults] = useState<{ date?: Date; providerId?: string; chairId?: string; startTime?: string }>({});
  const [shiftsOpen, setShiftsOpen] = useState(false);
  const [slotsOpen, setSlotsOpen] = useState(false);

  const startDate = viewMode === 'month'
    ? new Date(currentDate.getFullYear(), currentDate.getMonth(), 1)
    : startOfWeek(currentDate);
  const endDate = viewMode === 'day'
    ? currentDate
    : viewMode === 'month'
      ? new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0)
      : addDays(startDate, 6);

  const { data, isLoading, error } = useQuery({
    queryKey: ['schedule', viewMode, viewMode === 'day' ? toDateParam(currentDate) : startDate.toISOString(), providerFilter],
    queryFn: async () => {
      const params: Record<string, string> = {};
      if (providerFilter) params.providerId = providerFilter;
      if (viewMode === 'day') {
        params.date = toDateParam(currentDate);
        return apiGet<{ appointments: AppointmentListItem[] }>(`/appointments/schedule/day`, params);
      }
      params.startDate = startDate.toISOString();
      return apiGet<{ appointments: AppointmentListItem[] }>(`/appointments/schedule/${viewMode}`, params);
    },
    enabled: viewMode !== 'day' || !!toDateParam(currentDate),
  });

  const chairsQuery = useQuery({
    queryKey: ['chairs', 'schedule'],
    queryFn: getChairsForBooking,
    enabled: viewMode === 'day',
  });

  const providersQuery = useQuery({
    queryKey: ['providers', 'for-filter'],
    queryFn: getProviders,
  });

  const queryClient = useQueryClient();

  const rescheduleMutation = useMutation({
    mutationFn: (input: { id: string; startTime: string; endTime: string; chairId: string }) =>
      rescheduleAppointment(input.id, { startTime: input.startTime, endTime: input.endTime, chairId: input.chairId }),
    onSuccess: async () => {
      toast.success('Appointment moved');
      await queryClient.invalidateQueries({ queryKey: ['schedule'] });
      await queryClient.invalidateQueries({ queryKey: ['appointments'] });
    },
    onError: (err) => {
      const message = err instanceof Error ? err.message : '';
      toast.error(/conflict|overlap/i.test(message) ? 'That slot conflicts with an existing booking' : 'Failed to move appointment');
    },
  });

  const appointments = data?.appointments ?? [];

  // Drag & drop state for the day time grid.
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [hoverCell, setHoverCell] = useState<{ chairId: string; minutesFromStart: number } | null>(null);

  const gridBounds = useMemo(() => {
    let startMinute = GRID_START_HOUR * 60;
    let endMinute = GRID_END_HOUR * 60;
    for (const apt of appointments) {
      const start = new Date(apt.startTime);
      const end = new Date(apt.endTime);
      const aptStart = start.getHours() * 60 + start.getMinutes();
      const aptEnd = end.getHours() * 60 + end.getMinutes();
      if (isSameDay(start, currentDate)) startMinute = Math.min(startMinute, Math.floor(aptStart / SLOT_MINUTES) * SLOT_MINUTES);
      if (isSameDay(end, currentDate)) endMinute = Math.max(endMinute, Math.ceil(aptEnd / SLOT_MINUTES) * SLOT_MINUTES);
    }
    return { startMinute, endMinute };
  }, [appointments, currentDate]);

  const slotCount = Math.max(1, Math.round((gridBounds.endMinute - gridBounds.startMinute) / SLOT_MINUTES));
  const gridHeight = slotCount * ROW_HEIGHT;

  const snapToSlot = (clientY: number, element: HTMLElement) => {
    const rect = element.getBoundingClientRect();
    const offsetMinutes = ((clientY - rect.top) / ROW_HEIGHT) * SLOT_MINUTES;
    const snapped = Math.floor(offsetMinutes / SNAP_MINUTES) * SNAP_MINUTES;
    return gridBounds.startMinute + Math.max(0, Math.min(snapped, gridBounds.endMinute - gridBounds.startMinute - SNAP_MINUTES));
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>, chair: Chair) => {
    event.preventDefault();
    setHoverCell(null);
    const id = event.dataTransfer.getData('text/plain') || draggingId;
    setDraggingId(null);
    if (!id) return;

    const appointment = appointments.find((apt) => apt.id === id);
    if (!appointment) return;
    if (!isMoveable(appointment.status)) {
      toast.error(`${STATUS_LABELS[appointment.status] ?? appointment.status} bookings cannot be moved`);
      return;
    }

    const minutesFromStart = snapToSlot(event.clientY, event.currentTarget);
    const [startHours, startMinutes] = minutesToLabel(minutesFromStart).split(':').map(Number);
    const newStart = new Date(currentDate);
    newStart.setHours(startHours, startMinutes, 0, 0);
    const durationMs = new Date(appointment.endTime).getTime() - new Date(appointment.startTime).getTime();
    const newEnd = new Date(newStart.getTime() + durationMs);

    const unchanged = appointment.chairId === chair.id && Math.abs(new Date(appointment.startTime).getTime() - newStart.getTime()) < SNAP_MINUTES * 60_000;
    if (unchanged) return;

    rescheduleMutation.mutate({ id, startTime: newStart.toISOString(), endTime: newEnd.toISOString(), chairId: chair.id });
  };

  const step = viewMode === 'day' ? 1 : viewMode === 'week' ? 7 : 0;
  const changeDate = (direction: -1 | 1) => {
    if (viewMode === 'month') {
      setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + direction, 1));
    } else {
      setCurrentDate(addDays(currentDate, direction * step));
    }
  };

  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Schedule</h1>
          <p className="text-muted-foreground">Chair-side scheduling with practitioner availability</p>
        </div>
        <div className="text-center py-12"><p className="text-destructive">Failed to load schedule</p></div>
      </div>
    );
  }

  const activeChairs = (chairsQuery.data ?? []).filter((chair) => chair.isActive);
  const days = viewMode === 'day'
    ? [currentDate]
    : viewMode === 'month'
      ? Array.from({ length: endDate.getDate() }, (_, index) => addDays(startDate, index))
      : Array.from({ length: 7 }, (_, index) => addDays(startDate, index));

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Schedule</h1>
          <p className="text-muted-foreground">Drag bookings between chairs and times · conflicts are rejected server-side</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Select
            id="schedule-provider-filter"
            value={providerFilter}
            onChange={(event) => setProviderFilter(event.target.value)}
            className="w-48"
            aria-label="Filter by practitioner"
          >
            <option value="">All practitioners</option>
            {(providersQuery.data ?? []).filter((provider: Provider) => provider.isActive).map((provider: Provider) => (
              <option key={provider.id} value={provider.id}>Dr {provider.firstName} {provider.lastName}</option>
            ))}
          </Select>
          <Button variant="outline" onClick={() => setSlotsOpen(true)}>
            <Clock className="h-4 w-4 mr-2" /> Free slots
          </Button>
          <Button variant="outline" onClick={() => setShiftsOpen(true)}>
            <Settings2 className="h-4 w-4 mr-2" /> Schedules
          </Button>
          <div className="flex items-center rounded-lg border p-1">
            {(['day', 'week', 'month'] as ViewMode[]).map((mode) => (
              <Button key={mode} variant={viewMode === mode ? 'default' : 'ghost'} size="sm" onClick={() => setViewMode(mode)} className="capitalize">
                {mode}
              </Button>
            ))}
          </div>
          <Button onClick={() => { setBookingDefaults({ date: viewMode === 'day' ? currentDate : undefined, providerId: providerFilter || undefined }); setBookingOpen(true); }}>
            <Plus className="h-4 w-4 mr-2" /> New Appointment
          </Button>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={() => changeDate(-1)} aria-label="Previous">
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm font-medium min-w-48 text-center">
            {viewMode === 'day'
              ? formatDateLong(currentDate)
              : `${formatDateShort(startDate)} – ${formatDateLong(endDate)}`}
          </span>
          <Button variant="outline" size="icon" onClick={() => changeDate(1)} aria-label="Next">
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
        <Button variant="outline" size="sm" onClick={() => setCurrentDate(new Date())}>Today</Button>
      </div>

      {viewMode === 'day' ? (
        <DayTimeGrid
          date={currentDate}
          appointments={appointments}
          chairs={activeChairs}
          loading={isLoading || chairsQuery.isLoading}
          gridHeight={gridHeight}
          gridStartMinute={gridBounds.startMinute}
          slotCount={slotCount}
          draggingId={draggingId}
          hoverCell={hoverCell}
          onDragStart={setDraggingId}
          onDragEnd={() => { setDraggingId(null); setHoverCell(null); }}
          onColumnDragOver={(event, chair) => {
            event.preventDefault();
            setHoverCell({ chairId: chair.id, minutesFromStart: snapToSlot(event.clientY, event.currentTarget) });
          }}
          onColumnDragLeave={(chairId) => setHoverCell((cell) => (cell?.chairId === chairId ? null : cell))}
          onDrop={handleDrop}
          onBookInLane={(chairId) => { setBookingDefaults({ date: currentDate, chairId, providerId: providerFilter || undefined }); setBookingOpen(true); }}
        />
      ) : (
        <MultiDayGrid
          viewMode={viewMode}
          days={days}
          endDate={endDate}
          appointments={appointments}
          isLoading={isLoading}
        />
      )}

      <BookingDialog
        open={bookingOpen}
        onOpenChange={setBookingOpen}
        defaultDate={bookingDefaults.date}
        defaultProviderId={bookingDefaults.providerId}
        defaultChairId={bookingDefaults.chairId}
        defaultStartTime={bookingDefaults.startTime}
      />
      <ShiftsDialog open={shiftsOpen} onOpenChange={setShiftsOpen} />
      <FreeSlotsDialog
        open={slotsOpen}
        onOpenChange={setSlotsOpen}
        defaultProviderId={providerFilter || undefined}
        defaultDate={currentDate}
        onPickSlot={(date, startTime) => {
          setBookingDefaults({ date, startTime, providerId: providerFilter || undefined });
          setBookingOpen(true);
        }}
      />
    </div>
  );
}

function DayTimeGrid({
  date,
  appointments,
  chairs,
  loading,
  gridHeight,
  gridStartMinute,
  slotCount,
  draggingId,
  hoverCell,
  onDragStart,
  onDragEnd,
  onColumnDragOver,
  onColumnDragLeave,
  onDrop,
  onBookInLane,
}: {
  date: Date;
  appointments: AppointmentListItem[];
  chairs: Chair[];
  loading: boolean;
  gridHeight: number;
  gridStartMinute: number;
  slotCount: number;
  draggingId: string | null;
  hoverCell: { chairId: string; minutesFromStart: number } | null;
  onDragStart: (id: string) => void;
  onDragEnd: () => void;
  onColumnDragOver: (event: React.DragEvent<HTMLDivElement>, chair: Chair) => void;
  onColumnDragLeave: (chairId: string) => void;
  onDrop: (event: React.DragEvent<HTMLDivElement>, chair: Chair) => void;
  onBookInLane: (chairId: string) => void;
}) {
  const dayAppointments = appointments.filter((apt) => isSameDay(new Date(apt.startTime), date));

  if (loading) {
    return (
      <div className="border rounded-lg p-4 grid grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, index) => <Skeleton key={index} className="h-72 w-full" />)}
      </div>
    );
  }

  if (chairs.length === 0) {
    return (
      <div className="border rounded-lg p-10 text-center text-sm text-muted-foreground">
        No operatory chairs configured — add chairs under Practice › Chairs.
      </div>
    );
  }

  return (
    <div className="border rounded-lg overflow-x-auto">
      <div className="flex min-w-fit border-b bg-muted/40 sticky top-0 z-10">
        <div className="w-16 shrink-0 border-r" aria-hidden="true" />
        {chairs.map((chair) => (
          <div key={chair.id} className="flex-1 min-w-[220px] px-3 py-2 border-r last:border-r-0 flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold leading-tight">{chair.name}</p>
              <p className="text-xs text-muted-foreground">{dayAppointments.filter((apt) => apt.chairId === chair.id).length} booking(s)</p>
            </div>
            <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => onBookInLane(chair.id)} aria-label={`Book into ${chair.name}`}>
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        ))}
      </div>

      <div className="flex min-w-fit">
        <div className="w-16 shrink-0 border-r select-none" style={{ height: gridHeight }} aria-hidden="true">
          {Array.from({ length: Math.floor(slotCount / 2) + 1 }).map((_, hourIndex) => {
            const minutes = gridStartMinute + hourIndex * 60;
            if (minutes >= gridStartMinute + slotCount * SLOT_MINUTES) return null;
            return (
              <div key={minutes} className="relative" style={{ height: 2 * ROW_HEIGHT }}>
                <span className="absolute right-1 -top-1.5 text-[10px] text-muted-foreground">{minutesToLabel(minutes)}</span>
              </div>
            );
          })}
        </div>

        {chairs.map((chair) => (
          <div
            key={chair.id}
            className={cn(
              'relative flex-1 min-w-[220px] border-r last:border-r-0',
              hoverCell?.chairId === chair.id && draggingId && 'bg-accent/40',
            )}
            style={{ height: gridHeight }}
            onDragOver={(event) => onColumnDragOver(event, chair)}
            onDragLeave={() => onColumnDragLeave(chair.id)}
            onDrop={(event) => onDrop(event, chair)}
          >
            {/* Hour lines */}
            {Array.from({ length: slotCount }).map((_, index) => {
              if (index === 0) return null;
              const minutes = gridStartMinute + index * SLOT_MINUTES;
              return (
                <div
                  key={minutes}
                  className={cn('pointer-events-none absolute inset-x-0 border-t', minutes % 60 === 0 ? 'border-border' : 'border-border/40')}
                  style={{ top: index * ROW_HEIGHT }}
                />
              );
            })}

            {hoverCell?.chairId === chair.id && draggingId && (
              <div
                className="pointer-events-none absolute inset-x-1 h-2 -translate-y-1/2 rounded bg-primary/50"
                style={{ top: ((hoverCell.minutesFromStart - gridStartMinute) / SLOT_MINUTES) * ROW_HEIGHT }}
                role="presentation"
              />
            )}

            {dayAppointments
              .filter((apt) => apt.chairId === chair.id)
              .map((apt) => {
                const start = new Date(apt.startTime);
                const end = new Date(apt.endTime);
                const startMinutes = start.getHours() * 60 + start.getMinutes();
                const endMinutes = end.getHours() * 60 + end.getMinutes();
                const clampedStart = Math.max(gridStartMinute, startMinutes);
                const clampedEnd = Math.min(gridEndHourSafe(slotCount, gridStartMinute), Math.max(endMinutes, clampedStart + SLOT_MINUTES));
                const moveable = isMoveable(apt.status);
                return (
                  <div
                    key={apt.id}
                    draggable={moveable}
                    onDragStart={(event) => {
                      if (!moveable) {
                        event.preventDefault();
                        return;
                      }
                      event.dataTransfer.setData('text/plain', apt.id);
                      event.dataTransfer.effectAllowed = 'move';
                      onDragStart(apt.id);
                    }}
                    onDragEnd={onDragEnd}
                    title={`${formatTime(start)}–${formatTime(end)} · ${apt.patient.firstName} ${apt.patient.lastName} (${STATUS_LABELS[apt.status] ?? apt.status})${moveable ? '' : ' — locked, this status cannot be moved'}`}
                    className={cn(
                      'absolute inset-x-1 rounded-md border p-1.5 overflow-hidden shadow-sm',
                      moveable ? 'cursor-grab active:cursor-grabbing' : 'cursor-not-allowed opacity-80',
                      STATUS_COLORS[apt.status] ?? 'bg-muted',
                      draggingId === apt.id && 'opacity-40 ring-2 ring-primary',
                    )}
                    style={{
                      top: ((clampedStart - gridStartMinute) / SLOT_MINUTES) * ROW_HEIGHT + 1,
                      height: Math.max(((clampedEnd - clampedStart) / SLOT_MINUTES) * ROW_HEIGHT - 2, 28),
                    }}
                  >
                    <p className="text-[10px] font-mono font-semibold leading-tight">
                      {formatTime(start)}–{formatTime(end)}
                    </p>
                    <p className="text-xs font-medium truncate leading-tight">
                      {apt.patient.firstName} {apt.patient.lastName}
                    </p>
                    <p className="text-[10px] opacity-80 truncate">{apt.appointmentType.name}</p>
                  </div>
                );
              })}
          </div>
        ))}
      </div>

      {dayAppointments.some((apt) => !chairs.some((chair) => chair.id === apt.chairId)) && (
        <div className="border-t p-3 space-y-2">
          <p className="text-xs font-semibold text-destructive">Unassigned chair (drag into a lane)</p>
          <div className="flex flex-wrap gap-2">
            {dayAppointments
              .filter((apt) => !chairs.some((chair) => chair.id === apt.chairId))
              .map((apt) => {
                const moveable = isMoveable(apt.status);
                return (
                  <div
                    key={apt.id}
                    draggable={moveable}
                    onDragStart={(event) => {
                      if (!moveable) {
                        event.preventDefault();
                        return;
                      }
                      event.dataTransfer.setData('text/plain', apt.id);
                      onDragStart(apt.id);
                    }}
                    onDragEnd={onDragEnd}
                    title={`${STATUS_LABELS[apt.status] ?? apt.status}${moveable ? '' : ' — locked'}`}
                    className={cn(
                      'rounded-md border px-2 py-1 text-xs',
                      moveable ? 'cursor-grab' : 'cursor-not-allowed opacity-80',
                      STATUS_COLORS[apt.status] ?? 'bg-muted',
                      draggingId === apt.id && 'opacity-40',
                    )}
                  >
                    {formatTime(new Date(apt.startTime))} · {apt.patient.firstName} {apt.patient.lastName}
                  </div>
                );
              })}
          </div>
        </div>
      )}
    </div>
  );
}

function gridEndHourSafe(slotCount: number, gridStartMinute: number) {
  return gridStartMinute + slotCount * SLOT_MINUTES;
}

function MultiDayGrid({
  viewMode,
  days,
  endDate,
  appointments,
  isLoading,
}: {
  viewMode: ViewMode;
  days: Date[];
  endDate: Date;
  appointments: AppointmentListItem[];
  isLoading: boolean;
}) {
  const getAppointmentsForDay = (day: Date) => appointments.filter((apt) => isSameDay(new Date(apt.startTime), day));

  return (
    <div className="border rounded-lg overflow-hidden">
      <div className="grid grid-cols-7 border-b bg-muted/40">
        {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((name) => (
          <div key={name} className="p-3 text-center border-r last:border-r-0">
            <p className="text-xs text-muted-foreground uppercase">{name}</p>
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7">
        {days.map((day) => {
          const dayAppointments = getAppointmentsForDay(day);
          const isToday = isSameDay(day, new Date());
          return (
            <div key={day.toISOString()} className={cn('min-h-32 p-2 border-r border-b last:border-r-0', viewMode === 'week' && 'min-h-64', !isSameDay(day, endDate) && 'border-b')}>
              <p className={cn('text-sm mb-2 px-1', isToday ? 'font-semibold text-primary' : 'font-medium')}>
                {formatDayName(day)} {day.getDate()}
              </p>
              {isLoading ? (
                <div className="space-y-2">
                  {Array.from({ length: 2 }).map((_, index) => <Skeleton key={index} className="h-14 w-full" />)}
                </div>
              ) : dayAppointments.length === 0 ? (
                <p className="text-xs text-muted-foreground py-6 text-center">—</p>
              ) : (
                <div className="space-y-2">
                  {dayAppointments.map((apt) => <AppointmentCard key={apt.id} appointment={apt} compact />)}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function AppointmentCard({ appointment, compact = false }: { appointment: AppointmentListItem; compact?: boolean }) {
  const patientName = `${appointment.patient.firstName} ${appointment.patient.lastName}`.trim();
  const statusLabel = STATUS_LABELS[appointment.status] ?? appointment.status;
  return (
    <div className={cn('rounded-md border p-2.5 space-y-1', STATUS_COLORS[appointment.status] || 'bg-muted')}>
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-mono font-semibold">
          {formatTime(new Date(appointment.startTime))}–{formatTime(new Date(appointment.endTime))}
        </span>
        <span className={cn(badgeVariants({ variant: 'outline' }), 'bg-background/70 text-[10px] px-1.5')}>
          {statusLabel}
        </span>
      </div>
      <p className={cn('font-medium leading-tight', compact ? 'text-xs truncate' : 'text-sm truncate')}>
        {patientName}
        {appointment.patient.patientNumber ? ` · #${appointment.patient.patientNumber}` : ''}
      </p>
      {!compact && (
        <p className="text-xs opacity-90 truncate">
          {appointment.appointmentType.name}
          {appointment.appointmentType.code ? ` · ${appointment.appointmentType.code}` : ''}
        </p>
      )}
      {!compact && appointment.chair?.name && (
        <p className="text-xs opacity-75 truncate">Dr {appointment.provider.firstName} {appointment.provider.lastName}</p>
      )}
      {!compact && appointment.scheduledPrice != null && (
        <Badge variant="outline" className="bg-background/70 text-[10px]">{formatCurrency(Number(appointment.scheduledPrice))}</Badge>
      )}
    </div>
  );
}
