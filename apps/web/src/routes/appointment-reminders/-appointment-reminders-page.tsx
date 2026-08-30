import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { Search, Send } from 'lucide-react';
import { Button } from '@danta/ui/button';
import { Input } from '@danta/ui/input';
import { Badge } from '@danta/ui/badge';
import { Skeleton } from '@danta/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@danta/ui/table';
import { apiGet, apiPost } from '../../lib/api/request';
import { toast } from 'sonner';

type AppointmentReminder = {
  id: string;
  appointmentId: string;
  type: string;
  status: string;
  sentAt: string | null;
};

const STATUS_OPTIONS = [
  { value: '', label: 'All statuses' },
  { value: 'pending', label: 'Pending' },
  { value: 'sent', label: 'Sent' },
  { value: 'delivered', label: 'Delivered' },
  { value: 'failed', label: 'Failed' },
];

export function AppointmentRemindersPage() {
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['appointment-reminders', search, status],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      if (status) params.set('status', status);
      const response = await apiGet<{ reminders: AppointmentReminder[] }>(`/appointment-reminders?${params.toString()}`);
      return response;
    },
  });

  const handleSend = async (id: string) => {
    try {
      await apiPost(`/appointment-reminders/${id}/send`, {});
      toast.success('Reminder sent');
      refetch();
    } catch {
      toast.error('Failed to send reminder');
    }
  };

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Appointment Reminders</h1>
            <p className="text-muted-foreground">Manage appointment reminders</p>
          </div>
        </div>
        <div className="text-center py-12">
          <p className="text-destructive mb-4">Failed to load reminders</p>
          <Button onClick={() => refetch()} variant="outline">Retry</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Appointment Reminders</h1>
          <p className="text-muted-foreground">Manage appointment reminders</p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search reminders..."
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

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Appointment</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Sent At</TableHead>
              <TableHead className="w-10"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                  <TableCell><Skeleton className="h-6 w-16 rounded-full" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                  <TableCell><Skeleton className="h-8 w-8" /></TableCell>
                </TableRow>
              ))
            ) : data?.reminders?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-12 text-muted-foreground">
                  No reminders found
                </TableCell>
              </TableRow>
            ) : (
              data?.reminders?.map((reminder) => (
                <TableRow key={reminder.id}>
                  <TableCell className="font-medium">Appointment {reminder.appointmentId.slice(0, 8)}...</TableCell>
                  <TableCell className="capitalize">{reminder.type}</TableCell>
                  <TableCell>
                    <Badge variant={reminder.status === 'delivered' ? 'default' : reminder.status === 'failed' ? 'destructive' : 'secondary'}>
                      {reminder.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {reminder.sentAt ? new Date(reminder.sentAt).toLocaleString('en-AU') : '-'}
                  </TableCell>
                  <TableCell>
                    {reminder.status === 'pending' && (
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleSend(reminder.id)}>
                        <Send className="h-4 w-4" />
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
