import { createFileRoute, Link } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { BarChart3 } from 'lucide-react';

export const Route = createFileRoute('/reports/dashboard/')({
  component: DashboardPage,
});

type DashboardKpi = {
  todayAppointments: number;
  todayPatients: number;
  todayRevenue: number;
  outstandingBalance: number;
  activeRecalls: number;
  noShowsToday: number;
  averageDuration: number;
};

export function DashboardPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['reports', 'dashboard'],
    queryFn: async () => {
      const res = await fetch('/api/v1/reports/dashboard');
      if (!res.ok) throw new Error('Failed to fetch dashboard');
      return res.json() as Promise<DashboardKpi>;
    },
  });

  if (isLoading) return <div className="text-center py-12 text-muted-foreground">Loading...</div>;
  if (!data) return null;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <BarChart3 className="w-6 h-6" />
        <h1 className="text-2xl font-bold">Dashboard</h1>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="border rounded-lg p-4">
          <p className="text-sm text-muted-foreground">Today's Appointments</p>
          <p className="text-2xl font-bold">{data.todayAppointments}</p>
        </div>
        <div className="border rounded-lg p-4">
          <p className="text-sm text-muted-foreground">Today's Patients</p>
          <p className="text-2xl font-bold">{data.todayPatients}</p>
        </div>
        <div className="border rounded-lg p-4">
          <p className="text-sm text-muted-foreground">Today's Revenue</p>
          <p className="text-2xl font-bold">${data.todayRevenue.toLocaleString()}</p>
        </div>
        <div className="border rounded-lg p-4">
          <p className="text-sm text-muted-foreground">Outstanding Balance</p>
          <p className="text-2xl font-bold">${data.outstandingBalance.toLocaleString()}</p>
        </div>
        <div className="border rounded-lg p-4">
          <p className="text-sm text-muted-foreground">Active Recalls</p>
          <p className="text-2xl font-bold">{data.activeRecalls}</p>
        </div>
        <div className="border rounded-lg p-4">
          <p className="text-sm text-muted-foreground">No Shows Today</p>
          <p className="text-2xl font-bold">{data.noShowsToday}</p>
        </div>
        <div className="border rounded-lg p-4">
          <p className="text-sm text-muted-foreground">Avg Duration (min)</p>
          <p className="text-2xl font-bold">{data.averageDuration}</p>
        </div>
      </div>
      <div className="flex gap-4">
        <Link to="/reports/revenue" className="text-primary hover:underline">Revenue Report</Link>
        <Link to="/reports/appointments" className="text-primary hover:underline">Appointment Report</Link>
        <Link to="/reports/patients" className="text-primary hover:underline">Patient Report</Link>
      </div>
    </div>
  );
}
