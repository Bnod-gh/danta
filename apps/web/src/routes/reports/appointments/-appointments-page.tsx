import { useQuery } from '@tanstack/react-query';
import { Calendar } from 'lucide-react';

type AppointmentAnalytics = {
  totalAppointments: number;
  completed: number;
  cancelled: number;
  noShows: number;
  completionRate: number;
  noShowRate: number;
  averageDuration: number;
  byType: { typeId: string; typeName: string; count: number; duration: number }[];
  byProvider: { providerId: string; providerName: string; count: number; completed: number; noShows: number }[];
  daily: { date: string; count: number; completed: number; noShows: number }[];
};

export function AppointmentsPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['reports', 'appointments'],
    queryFn: async () => {
      const res = await fetch('/api/v1/reports/appointments');
      if (!res.ok) throw new Error('Failed to fetch appointments report');
      return res.json() as Promise<AppointmentAnalytics>;
    },
  });

  if (isLoading) return <div className="text-center py-12 text-muted-foreground">Loading...</div>;
  if (!data) return null;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Calendar className="w-6 h-6" />
        <h1 className="text-2xl font-bold">Appointment Analytics</h1>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="border rounded-lg p-4">
          <p className="text-sm text-muted-foreground">Total Appointments</p>
          <p className="text-2xl font-bold">{data.totalAppointments}</p>
        </div>
        <div className="border rounded-lg p-4">
          <p className="text-sm text-muted-foreground">Completed</p>
          <p className="text-2xl font-bold">{data.completed}</p>
        </div>
        <div className="border rounded-lg p-4">
          <p className="text-sm text-muted-foreground">Completion Rate</p>
          <p className="text-2xl font-bold">{data.completionRate.toFixed(1)}%</p>
        </div>
        <div className="border rounded-lg p-4">
          <p className="text-sm text-muted-foreground">No Show Rate</p>
          <p className="text-2xl font-bold">{data.noShowRate.toFixed(1)}%</p>
        </div>
      </div>
      <div className="border rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/40">
            <tr>
              <th className="text-left px-4 py-3 font-medium">Type</th>
              <th className="text-left px-4 py-3 font-medium">Count</th>
              <th className="text-left px-4 py-3 font-medium">Duration (min)</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {data.byType.map((t) => (
              <tr key={t.typeId} className="hover:bg-muted/20">
                <td className="px-4 py-3">{t.typeName}</td>
                <td className="px-4 py-3">{t.count}</td>
                <td className="px-4 py-3">{t.duration}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="border rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/40">
            <tr>
              <th className="text-left px-4 py-3 font-medium">Provider</th>
              <th className="text-left px-4 py-3 font-medium">Count</th>
              <th className="text-left px-4 py-3 font-medium">Completed</th>
              <th className="text-left px-4 py-3 font-medium">No Shows</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {data.byProvider.map((p) => (
              <tr key={p.providerId} className="hover:bg-muted/20">
                <td className="px-4 py-3">{p.providerName}</td>
                <td className="px-4 py-3">{p.count}</td>
                <td className="px-4 py-3">{p.completed}</td>
                <td className="px-4 py-3">{p.noShows}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
