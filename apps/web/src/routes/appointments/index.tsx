import { createFileRoute } from '@tanstack/react-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { Plus, Pencil, Trash2, CalendarIcon } from 'lucide-react';
import { cn } from '@danta/ui';

export const Route = createFileRoute('/appointments/')({
  component: AppointmentsPage,
});

type Appointment = {
  id: string;
  patient: { id: string; firstName: string; lastName: string };
  provider: { id: string; firstName: string; lastName: string; color?: string };
  chair: { id: string; name: string };
  appointmentType: { id: string; name: string; duration: number; color?: string };
  startTime: string;
  endTime: string;
  status: string;
  notes?: string;
};

type PatientOption = { id: string; firstName: string; lastName: string };
type ProviderOption = { id: string; firstName: string; lastName: string; color?: string };
type ChairOption = { id: string; name: string };
type AppointmentTypeOption = { id: string; name: string; duration: number };

const STATUS_COLORS: Record<string, string> = {
  scheduled: 'bg-blue-100 text-blue-800',
  confirmed: 'bg-green-100 text-green-800',
  checked_in: 'bg-purple-100 text-purple-800',
  in_progress: 'bg-yellow-100 text-yellow-800',
  completed: 'bg-gray-100 text-gray-800',
  cancelled: 'bg-red-100 text-red-800',
  no_show: 'bg-orange-100 text-orange-800',
};

export function AppointmentsPage() {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [dateFilter, setDateFilter] = useState(new Date().toISOString().split('T')[0]);
  const [patientId, setPatientId] = useState('');
  const [providerId, setProviderId] = useState('');
  const [chairId, setChairId] = useState('');
  const [appointmentTypeId, setAppointmentTypeId] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [status, setStatus] = useState('scheduled');
  const [notes, setNotes] = useState('');

  const { data: appointments, isLoading } = useQuery({
    queryKey: ['appointments', dateFilter],
    queryFn: async () => {
      const res = await fetch(`/api/v1/appointments?startFrom=${dateFilter}T00:00:00.000Z&startTo=${dateFilter}T23:59:59.999Z`);
      if (!res.ok) throw new Error('Failed to fetch appointments');
      return res.json() as Promise<Appointment[]>;
    },
  });

  const { data: patients } = useQuery({
    queryKey: ['patients-list'],
    queryFn: async () => {
      const res = await fetch('/api/v1/patients');
      if (!res.ok) throw new Error('Failed to fetch patients');
      return res.json() as Promise<{ patients: PatientOption[] }>;
    },
  });

  const { data: providers } = useQuery({
    queryKey: ['providers-list'],
    queryFn: async () => {
      const res = await fetch('/api/v1/providers');
      if (!res.ok) throw new Error('Failed to fetch providers');
       return res.json() as Promise<ProviderOption[]>;
    },
  });

  const { data: chairs } = useQuery({
    queryKey: ['chairs-list'],
    queryFn: async () => {
      const res = await fetch('/api/v1/chairs');
      if (!res.ok) throw new Error('Failed to fetch chairs');
       return res.json() as Promise<ChairOption[]>;
    },
  });

  const { data: appointmentTypes } = useQuery({
    queryKey: ['appointment-types-list'],
    queryFn: async () => {
      const res = await fetch('/api/v1/appointment-types');
      if (!res.ok) throw new Error('Failed to fetch appointment types');
       return res.json() as Promise<AppointmentTypeOption[]>;
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await fetch('/api/v1/appointments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error('Failed to create appointment');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
      resetForm();
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const res = await fetch(`/api/v1/appointments/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error('Failed to update appointment');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
      resetForm();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/v1/appointments/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete appointment');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
    },
  });

  const resetForm = () => {
    setPatientId('');
    setProviderId('');
    setChairId('');
    setAppointmentTypeId('');
    setStartTime('');
    setEndTime('');
    setStatus('scheduled');
    setNotes('');
    setShowForm(false);
    setEditingId(null);
  };

  const handleEdit = (apt: Appointment) => {
    setPatientId(apt.patient.id);
    setProviderId(apt.provider.id);
    setChairId(apt.chair.id);
    setAppointmentTypeId(apt.appointmentType.id);
    setStartTime(new Date(apt.startTime).toISOString().slice(0, 16));
    setEndTime(new Date(apt.endTime).toISOString().slice(0, 16));
    setStatus(apt.status);
    setNotes(apt.notes || '');
    setEditingId(apt.id);
    setShowForm(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const data = { patientId, providerId, chairId, appointmentTypeId, startTime, endTime, status, notes: notes || undefined };
    if (editingId) {
      updateMutation.mutate({ id: editingId, data });
    } else {
      createMutation.mutate(data);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Appointments</h1>
          <p className="text-muted-foreground">Manage bookings and schedule</p>
        </div>
        <button
          onClick={() => { resetForm(); setShowForm(true); }}
          className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium"
        >
          <Plus className="w-4 h-4" />
          New Appointment
        </button>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative">
          <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="date"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="pl-9 pr-4 py-2 border rounded-md text-sm"
          />
        </div>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="border rounded-lg p-4 space-y-4">
          <h3 className="font-medium">{editingId ? 'Edit' : 'New'} Appointment</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Patient</label>
              <select value={patientId} onChange={(e) => setPatientId(e.target.value)} className="w-full px-3 py-2 border rounded-md text-sm" required>
                <option value="">Select patient</option>
                {patients?.patients?.map((p) => (
                  <option key={p.id} value={p.id}>{p.firstName} {p.lastName}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Provider</label>
              <select value={providerId} onChange={(e) => setProviderId(e.target.value)} className="w-full px-3 py-2 border rounded-md text-sm" required>
                <option value="">Select provider</option>
                {providers?.map((p) => (
                  <option key={p.id} value={p.id}>{p.firstName} {p.lastName}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Chair</label>
              <select value={chairId} onChange={(e) => setChairId(e.target.value)} className="w-full px-3 py-2 border rounded-md text-sm" required>
                <option value="">Select chair</option>
                {chairs?.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Type</label>
              <select value={appointmentTypeId} onChange={(e) => setAppointmentTypeId(e.target.value)} className="w-full px-3 py-2 border rounded-md text-sm" required>
                <option value="">Select type</option>
                {appointmentTypes?.map((t) => (
                  <option key={t.id} value={t.id}>{t.name} ({t.duration} min)</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Start</label>
              <input type="datetime-local" value={startTime} onChange={(e) => setStartTime(e.target.value)} className="w-full px-3 py-2 border rounded-md text-sm" required />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">End</label>
              <input type="datetime-local" value={endTime} onChange={(e) => setEndTime(e.target.value)} className="w-full px-3 py-2 border rounded-md text-sm" required />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Status</label>
              <select value={status} onChange={(e) => setStatus(e.target.value)} className="w-full px-3 py-2 border rounded-md text-sm">
                <option value="scheduled">Scheduled</option>
                <option value="confirmed">Confirmed</option>
                <option value="checked_in">Checked In</option>
                <option value="in_progress">In Progress</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
                <option value="no_show">No Show</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Notes</label>
              <input value={notes} onChange={(e) => setNotes(e.target.value)} className="w-full px-3 py-2 border rounded-md text-sm" />
            </div>
          </div>
          <div className="flex gap-2">
            <button type="submit" className="px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm">{editingId ? 'Update' : 'Book'}</button>
            <button type="button" onClick={resetForm} className="px-4 py-2 border rounded-md text-sm">Cancel</button>
          </div>
        </form>
      )}

      {isLoading ? (
        <div className="text-center py-12 text-muted-foreground">Loading...</div>
      ) : (
        <>
          <div className="border rounded-lg overflow-hidden">
            <div className="grid grid-cols-[80px_1fr] bg-muted/40">
              <div className="px-2 py-2 text-xs font-medium border-r">Time</div>
              <div className="px-2 py-2 text-xs font-medium">Day View</div>
            </div>
            <div className="grid grid-cols-[80px_1fr]">
              {Array.from({ length: 12 }, (_, i) => i + 8).map((hour) => (
                <>
                  <div key={`time-${hour}`} className="px-2 py-3 text-xs text-muted-foreground border-r border-b h-16">
                    {hour.toString().padStart(2, '0')}:00
                  </div>
                  <div key={`slot-${hour}`} className="px-2 py-3 border-b h-16 relative">
                    {appointments?.filter((apt) => {
                      const start = new Date(apt.startTime);
                      return start.getHours() === hour && start.toDateString() === dateFilter;
                    }).map((apt) => {
                      const start = new Date(apt.startTime);
                      const end = new Date(apt.endTime);
                      const durationMin = (end.getTime() - start.getTime()) / 60000;
                      const height = Math.max(durationMin / 15 * 64, 32);
                      const top = (start.getMinutes() / 60) * 64;
                      return (
                        <div
                          key={apt.id}
                          className="absolute left-1 right-1 rounded-md p-1 overflow-hidden"
                          style={{ top, height, backgroundColor: apt.provider.color || '#3b82f6' + '20', borderLeft: `3px solid ${apt.provider.color || '#3b82f6'}` }}
                        >
                          <div className="text-xs font-medium truncate">{apt.patient.firstName} {apt.patient.lastName}</div>
                          <div className="text-[10px] text-muted-foreground truncate">{apt.appointmentType.name}</div>
                        </div>
                      );
                    })}
                  </div>
                </>
              ))}
            </div>
          </div>

          <div className="border rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-muted/40">
                <tr>
                  <th className="text-left px-4 py-3 font-medium">Time</th>
                  <th className="text-left px-4 py-3 font-medium">Patient</th>
                  <th className="text-left px-4 py-3 font-medium">Provider</th>
                  <th className="text-left px-4 py-3 font-medium">Chair</th>
                  <th className="text-left px-4 py-3 font-medium">Type</th>
                  <th className="text-left px-4 py-3 font-medium">Status</th>
                  <th className="text-left px-4 py-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {appointments?.map((apt) => (
                  <tr key={apt.id} className="hover:bg-muted/20">
                    <td className="px-4 py-3">
                      {new Date(apt.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - {new Date(apt.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="px-4 py-3">{apt.patient.firstName} {apt.patient.lastName}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: apt.provider.color || '#3b82f6' }} />
                        {apt.provider.firstName} {apt.provider.lastName}
                      </div>
                    </td>
                    <td className="px-4 py-3">{apt.chair.name}</td>
                    <td className="px-4 py-3">{apt.appointmentType.name}</td>
                    <td className="px-4 py-3">
                      <span className={cn('px-2 py-1 rounded-full text-xs font-medium', STATUS_COLORS[apt.status] || 'bg-gray-100 text-gray-800')}>
                        {apt.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <button onClick={() => handleEdit(apt)} className="p-2 hover:bg-muted rounded"><Pencil className="w-4 h-4" /></button>
                        <button onClick={() => deleteMutation.mutate(apt.id)} className="p-2 hover:bg-muted rounded text-red-600"><Trash2 className="w-4 h-4" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
