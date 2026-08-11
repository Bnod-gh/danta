import { createFileRoute } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { Users } from 'lucide-react';

export const Route = createFileRoute('/reports/patients/')({
  component: PatientsPage,
});

type PatientAnalytics = {
  totalPatients: number;
  activePatients: number;
  newPatientsThisMonth: number;
  newPatientsLastMonth: number;
  growthRate: number;
  byGender: { gender: string; count: number }[];
  byAgeGroup: { ageGroup: string; count: number }[];
  retention: { returningPatients: number; retentionRate: number };
  topVisitors: { patientId: string; patientName: string; visitCount: number; lastVisit: string }[];
};

export function PatientsPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['reports', 'patients'],
    queryFn: async () => {
      const res = await fetch('/api/v1/reports/patients');
      if (!res.ok) throw new Error('Failed to fetch patients report');
      return res.json() as Promise<PatientAnalytics>;
    },
  });

  if (isLoading) return <div className="text-center py-12 text-muted-foreground">Loading...</div>;
  if (!data) return null;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Users className="w-6 h-6" />
        <h1 className="text-2xl font-bold">Patient Analytics</h1>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="border rounded-lg p-4">
          <p className="text-sm text-muted-foreground">Total Patients</p>
          <p className="text-2xl font-bold">{data.totalPatients}</p>
        </div>
        <div className="border rounded-lg p-4">
          <p className="text-sm text-muted-foreground">Active Patients</p>
          <p className="text-2xl font-bold">{data.activePatients}</p>
        </div>
        <div className="border rounded-lg p-4">
          <p className="text-sm text-muted-foreground">New This Month</p>
          <p className="text-2xl font-bold">{data.newPatientsThisMonth}</p>
        </div>
        <div className="border rounded-lg p-4">
          <p className="text-sm text-muted-foreground">Growth Rate</p>
          <p className="text-2xl font-bold">{data.growthRate.toFixed(1)}%</p>
        </div>
      </div>
      <div className="border rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/40">
            <tr>
              <th className="text-left px-4 py-3 font-medium">Gender</th>
              <th className="text-left px-4 py-3 font-medium">Count</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {data.byGender.map((g) => (
              <tr key={g.gender} className="hover:bg-muted/20">
                <td className="px-4 py-3 capitalize">{g.gender}</td>
                <td className="px-4 py-3">{g.count}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="border rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/40">
            <tr>
              <th className="text-left px-4 py-3 font-medium">Age Group</th>
              <th className="text-left px-4 py-3 font-medium">Count</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {data.byAgeGroup.map((a) => (
              <tr key={a.ageGroup} className="hover:bg-muted/20">
                <td className="px-4 py-3">{a.ageGroup}</td>
                <td className="px-4 py-3">{a.count}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="border rounded-lg p-4">
        <p className="text-sm text-muted-foreground">Returning Patients</p>
        <p className="text-2xl font-bold">{data.retention.returningPatients}</p>
        <p className="text-sm text-muted-foreground">Retention Rate: {data.retention.retentionRate.toFixed(1)}%</p>
      </div>
      <div className="border rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/40">
            <tr>
              <th className="text-left px-4 py-3 font-medium">Patient</th>
              <th className="text-left px-4 py-3 font-medium">Visits</th>
              <th className="text-left px-4 py-3 font-medium">Last Visit</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {data.topVisitors.map((v) => (
              <tr key={v.patientId} className="hover:bg-muted/20">
                <td className="px-4 py-3">{v.patientName}</td>
                <td className="px-4 py-3">{v.visitCount}</td>
                <td className="px-4 py-3">{new Date(v.lastVisit).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
