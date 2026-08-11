import { createFileRoute } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { Calendar } from 'lucide-react';

export const Route = createFileRoute('/patient-portal/appointments/')({
  component: PatientPortalAppointments,
});

type Appointment = {
  id: string;
  startTime: string;
  endTime: string;
  status: string;
  notes: string | null;
  provider: { firstName: string; lastName: string };
  appointmentType: { name: string; duration: number };
  chair: { name: string };
};

export function PatientPortalAppointments() {
  const { data: appointments, isLoading } = useQuery({
    queryKey: ['patient-portal', 'appointments'],
    queryFn: async () => {
      const token = localStorage.getItem('patientAccessToken');
      const res = await fetch('/api/v1/patient-portal/appointments', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Failed to fetch appointments');
      return res.json() as Promise<Appointment[]>;
    },
  });

  if (isLoading) return <div className="text-center py-12 text-muted-foreground">Loading...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Calendar className="w-6 h-6" />
        <h1 className="text-2xl font-bold">My Appointments</h1>
      </div>
      {!appointments || appointments.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">No appointments found</div>
      ) : (
        <div className="border rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/40">
              <tr>
                <th className="text-left px-4 py-3 font-medium">Date</th>
                <th className="text-left px-4 py-3 font-medium">Type</th>
                <th className="text-left px-4 py-3 font-medium">Provider</th>
                <th className="text-left px-4 py-3 font-medium">Duration</th>
                <th className="text-left px-4 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {appointments.map((a) => (
                <tr key={a.id} className="hover:bg-muted/20">
                  <td className="px-4 py-3">{new Date(a.startTime).toLocaleString()}</td>
                  <td className="px-4 py-3">{a.appointmentType.name}</td>
                  <td className="px-4 py-3">{a.provider.firstName} {a.provider.lastName}</td>
                  <td className="px-4 py-3">{a.appointmentType.duration} min</td>
                  <td className="px-4 py-3">
                    <span className="px-2 py-1 bg-primary/10 rounded-full text-xs font-medium capitalize">{a.status}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
