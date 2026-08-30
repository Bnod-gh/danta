import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { MoreHorizontal, Plus, Search } from 'lucide-react';
import { Button } from '@danta/ui/button';
import { Input } from '@danta/ui/input';
import { Badge } from '@danta/ui/badge';
import { Skeleton } from '@danta/ui/skeleton';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@danta/ui/dropdown-menu';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@danta/ui/table';
import {
  cancelAppointment,
  confirmAppointment,
  getAppointments,
  transition,
  type AppointmentListItem,
  type StatusAction,
} from '../../lib/api/appointments';
import { availableActions, type StatusActionOption } from '../../lib/appointment-utils';
import { BookingDialog } from '../../components/appointments/BookingDialog';
import { formatCurrency } from '../../lib/format';
import { toast } from 'sonner';

const STATUS_OPTIONS = [
  { value: '', label: 'All statuses' },
  { value: 'scheduled', label: 'Scheduled' },
  { value: 'confirmed', label: 'Confirmed' },
  { value: 'checked_in', label: 'Checked In' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' },
  { value: 'no_show', label: 'No Show' },
];

function getStatusBadge(status: string) {
  const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
    scheduled: 'secondary',
    confirmed: 'default',
    checked_in: 'default',
    in_progress: 'default',
    completed: 'outline',
    cancelled: 'destructive',
    no_show: 'destructive',
  };
  const labels: Record<string, string> = {
    scheduled: 'Scheduled',
    confirmed: 'Confirmed',
    checked_in: 'Checked In',
    in_progress: 'In Chair',
    completed: 'Completed',
    cancelled: 'Cancelled',
    no_show: 'No Show',
  };
  return <Badge variant={variants[status] || 'outline'}>{labels[status] || status}</Badge>;
}

export function AppointmentsPage() {
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [bookingOpen, setBookingOpen] = useState(false);
  const queryClient = useQueryClient();

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['appointments', search, status],
    queryFn: () => getAppointments({ search: search || undefined, status: status || undefined, take: 50 }),
  });

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ['appointments'] });
    queryClient.invalidateQueries({ queryKey: ['schedule'] });
    queryClient.invalidateQueries({ queryKey: ['dashboard'] });
  };

  const runAction = async (appointment: AppointmentListItem, action: StatusActionOption['action']) => {
    try {
      if (action === 'confirm') await confirmAppointment(appointment.id);
      else if (action === 'cancel') await cancelAppointment(appointment.id);
      else await transition(appointment.id, action as StatusAction);
      toast.success(`${ACTION_TOAST[action]} — ${appointment.patient.firstName} ${appointment.patient.lastName}`);
      refresh();
    } catch {
      toast.error(`Failed to update appointment (${ACTION_TOAST[action]})`);
    }
  };

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Appointments</h1>
            <p className="text-muted-foreground">Manage appointments</p>
          </div>
        </div>
        <div className="text-center py-12">
          <p className="text-destructive mb-4">Failed to load appointments</p>
          <Button onClick={() => refetch()} variant="outline">Retry</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Appointments</h1>
          <p className="text-muted-foreground">Manage appointments</p>
        </div>
        <Button onClick={() => setBookingOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          New Appointment
        </Button>
      </div>

      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search appointments..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="h-10 px-3 py-2 border rounded-md text-sm bg-background"
        >
          {STATUS_OPTIONS.map(option => (
            <option key={option.value} value={option.value}>{option.label}</option>
          ))}
        </select>
      </div>

      <div className="border rounded-lg overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Patient</TableHead>
              <TableHead>Procedure</TableHead>
              <TableHead>Provider / Chair</TableHead>
              <TableHead>Date & Time</TableHead>
              <TableHead>Price</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-12" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell><Skeleton className="h-4 w-36" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-40" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-40" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                  <TableCell><Skeleton className="h-6 w-20 rounded-full" /></TableCell>
                  <TableCell><Skeleton className="h-8 w-8" /></TableCell>
                </TableRow>
              ))
            ) : data?.data?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-12 text-muted-foreground">
                  No appointments found
                </TableCell>
              </TableRow>
            ) : (
              data?.data?.map((appointment) => {
                const actions = availableActions(appointment.status);
                return (
                  <TableRow key={appointment.id}>
                    <TableCell>
                      <p className="font-medium">{appointment.patient.firstName} {appointment.patient.lastName}</p>
                      <p className="text-xs text-muted-foreground">#{appointment.patient.patientNumber}</p>
                    </TableCell>
                    <TableCell>
                      <p>{appointment.appointmentType.name}</p>
                      {appointment.appointmentType.code && (
                        <p className="font-mono text-xs text-muted-foreground">{appointment.appointmentType.code}</p>
                      )}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      Dr {appointment.provider.firstName} {appointment.provider.lastName}
                      {appointment.chair.name ? ` · ${appointment.chair.name}` : ''}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {new Date(appointment.startTime).toLocaleString('en-AU', { dateStyle: 'medium', timeStyle: 'short' })}
                      {' – '}
                      {new Date(appointment.endTime).toLocaleTimeString('en-AU', { timeStyle: 'short' })}
                    </TableCell>
                    <TableCell>
                      {appointment.scheduledPrice != null ? formatCurrency(Number(appointment.scheduledPrice)) : '—'}
                    </TableCell>
                    <TableCell>{getStatusBadge(appointment.status)}</TableCell>
                    <TableCell>
                      {actions.length > 0 ? (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8" aria-label="Appointment actions">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            {actions.map((option, index) => (
                              <div key={option.action}>
                                {(option.action === 'no-show' || option.action === 'cancel') && index > 0 && (
                                  <DropdownMenuSeparator />
                                )}
                                <DropdownMenuItem
                                  onClick={() => runAction(appointment, option.action)}
                                  className={option.action === 'cancel' || option.action === 'no-show' ? 'text-destructive' : undefined}
                                >
                                  {option.label}
                                </DropdownMenuItem>
                              </div>
                            ))}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      ) : (
                        <span className="text-xs text-muted-foreground px-2">—</span>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      <BookingDialog open={bookingOpen} onOpenChange={setBookingOpen} />
    </div>
  );
}

const ACTION_TOAST: Record<StatusActionOption['action'], string> = {
  confirm: 'Confirmed',
  'check-in': 'Checked in',
  start: 'Started',
  complete: 'Completed',
  'no-show': 'Marked as no-show',
  cancel: 'Cancelled',
};

