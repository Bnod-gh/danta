import { createFileRoute } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { UserCheck } from 'lucide-react';

export const Route = createFileRoute('/reports/practitioners/')({
  component: PractitionersPage,
});

type PractitionerAnalytics = {
  providers: {
    providerId: string;
    providerName: string;
    appointments: number;
    completed: number;
    noShows: number;
    production: number;
    revenue: number;
    patients: number;
    newPatients: number;
  }[];
};

export function PractitionersPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['reports', 'practitioners'],
    queryFn: async () => {
      const res = await fetch('/api/v1/reports/practitioners');
      if (!res.ok) throw new Error('Failed to fetch practitioners report');
      return res.json() as Promise<PractitionerAnalytics>;
    },
  });

  if (isLoading) return <div className="text-center py-12 text-muted-foreground">Loading...</div>;
  if (!data) return null;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <UserCheck className="w-6 h-6" />
        <h1 className="text-2xl font-bold">Practitioner Analytics</h1>
      </div>
      <div className="border rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/40">
            <tr>
              <th className="text-left px-4 py-3 font-medium">Provider</th>
              <th className="text-left px-4 py-3 font-medium">Appointments</th>
              <th className="text-left px-4 py-3 font-medium">Completed</th>
              <th className="text-left px-4 py-3 font-medium">No Shows</th>
              <th className="text-left px-4 py-3 font-medium">Production</th>
              <th className="text-left px-4 py-3 font-medium">Revenue</th>
              <th className="text-left px-4 py-3 font-medium">Patients</th>
              <th className="text-left px-4 py-3 font-medium">New Patients</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {data.providers.map((p) => (
              <tr key={p.providerId} className="hover:bg-muted/20">
                <td className="px-4 py-3">{p.providerName}</td>
                <td className="px-4 py-3">{p.appointments}</td>
                <td className="px-4 py-3">{p.completed}</td>
                <td className="px-4 py-3">{p.noShows}</td>
                <td className="px-4 py-3">${p.production.toLocaleString()}</td>
                <td className="px-4 py-3">${p.revenue.toLocaleString()}</td>
                <td className="px-4 py-3">{p.patients}</td>
                <td className="px-4 py-3">{p.newPatients}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
