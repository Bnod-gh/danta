import { createFileRoute } from '@tanstack/react-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState, useEffect } from 'react';
import { Plus } from 'lucide-react';
import { cn } from '@danta/ui';

export const Route = createFileRoute('/appointment-reminders/')({
  component: AppointmentRemindersPage,
});

type AppointmentReminder = {
  id: string;
  appointmentId: string;
  channel: string;
  status: string;
  scheduledAt: string;
  sentAt?: string;
  deliveredAt?: string;
  error?: string;
};

type AppointmentOption = {
  id: string;
  patient: { firstName: string; lastName: string };
  startTime: string;
};

export function AppointmentRemindersPage() {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [appointmentId, setAppointmentId] = useState('');
  const [channel, setChannel] = useState('sms');
  const [scheduledAt, setScheduledAt] = useState('');
  const [appointments, setAppointments] = useState<AppointmentOption[]>([]);

  useEffect(() => {
    fetch('/api/v1/appointments')
      .then((res) => res.json())
      .then((data) => setAppointments(data as AppointmentOption[]))
      .catch(() => {});
  }, []);

  const { data: reminders, isLoading } = useQuery({
    queryKey: ['appointment-reminders'],
    queryFn: async () => {
      const res = await fetch('/api/v1/appointment-reminders');
      if (!res.ok) throw new Error('Failed to fetch appointment reminders');
      return res.json() as Promise<AppointmentReminder[]>;
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: { appointmentId: string; channel: string; scheduledAt: string }) => {
      const res = await fetch('/api/v1/appointment-reminders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error('Failed to create reminder');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointment-reminders'] });
      resetForm();
    },
  });

  const resetForm = () => {
    setAppointmentId('');
    setChannel('sms');
    setScheduledAt('');
    setShowForm(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate({
      appointmentId,
      channel,
      scheduledAt,
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Appointment Reminders</h1>
          <p className="text-muted-foreground">Schedule and track appointment reminders</p>
        </div>
        <button
          onClick={() => { resetForm(); setShowForm(true); }}
          className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium"
        >
          <Plus className="w-4 h-4" />
          New Reminder
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="border rounded-lg p-4 space-y-4">
          <h3 className="font-medium">New Appointment Reminder</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Appointment</label>
              <select value={appointmentId} onChange={(e) => setAppointmentId(e.target.value)} className="w-full px-3 py-2 border rounded-md text-sm" required>
                <option value="">Select appointment</option>
                {appointments?.map((a) => (
                  <option key={a.id} value={a.id}>{a.patient.firstName} {a.patient.lastName} - {new Date(a.startTime).toLocaleString()}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Channel</label>
              <select value={channel} onChange={(e) => setChannel(e.target.value)} className="w-full px-3 py-2 border rounded-md text-sm">
                <option value="sms">SMS</option>
                <option value="email">Email</option>
                <option value="in_app">In-App</option>
                <option value="patient_portal">Patient Portal</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Scheduled At</label>
              <input type="datetime-local" value={scheduledAt} onChange={(e) => setScheduledAt(e.target.value)} className="w-full px-3 py-2 border rounded-md text-sm" required />
            </div>
          </div>
          <div className="flex gap-2">
            <button type="submit" className="px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm">Create</button>
            <button type="button" onClick={resetForm} className="px-4 py-2 border rounded-md text-sm">Cancel</button>
          </div>
        </form>
      )}

      {isLoading ? (
        <div className="text-center py-12 text-muted-foreground">Loading...</div>
      ) : (
        <div className="border rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/40">
              <tr>
                <th className="text-left px-4 py-3 font-medium">Appointment</th>
                <th className="text-left px-4 py-3 font-medium">Channel</th>
                <th className="text-left px-4 py-3 font-medium">Scheduled</th>
                <th className="text-left px-4 py-3 font-medium">Status</th>
                <th className="text-left px-4 py-3 font-medium">Error</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {reminders?.map((r) => (
                <tr key={r.id} className="hover:bg-muted/20">
                  <td className="px-4 py-3">{r.appointmentId}</td>
                  <td className="px-4 py-3 capitalize">{r.channel.replace('_', ' ')}</td>
                  <td className="px-4 py-3">{new Date(r.scheduledAt).toLocaleString()}</td>
                  <td className="px-4 py-3">
                    <span className={cn('px-2 py-1 rounded-full text-xs font-medium', r.status === 'sent' || r.status === 'delivered' ? 'bg-green-100 text-green-800' : r.status === 'failed' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800')}>
                      {r.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">{r.error || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
