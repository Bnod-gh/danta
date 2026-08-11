import { createFileRoute } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { Bell } from 'lucide-react';

export const Route = createFileRoute('/reports/recalls/')({
  component: RecallsPage,
});

type RecallAnalytics = {
  totalRecalls: number;
  due: number;
  overdue: number;
  completed: number;
  completionRate: number;
  byType: { type: string; count: number; completed: number }[];
  contactStats: {
    totalContacts: number;
    smsSent: number;
    emailSent: number;
    phoneCalls: number;
  };
};

export function RecallsPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['reports', 'recalls'],
    queryFn: async () => {
      const res = await fetch('/api/v1/reports/recalls');
      if (!res.ok) throw new Error('Failed to fetch recalls report');
      return res.json() as Promise<RecallAnalytics>;
    },
  });

  if (isLoading) return <div className="text-center py-12 text-muted-foreground">Loading...</div>;
  if (!data) return null;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Bell className="w-6 h-6" />
        <h1 className="text-2xl font-bold">Recall Analytics</h1>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="border rounded-lg p-4">
          <p className="text-sm text-muted-foreground">Total Recalls</p>
          <p className="text-2xl font-bold">{data.totalRecalls}</p>
        </div>
        <div className="border rounded-lg p-4">
          <p className="text-sm text-muted-foreground">Due</p>
          <p className="text-2xl font-bold">{data.due}</p>
        </div>
        <div className="border rounded-lg p-4">
          <p className="text-sm text-muted-foreground">Overdue</p>
          <p className="text-2xl font-bold">{data.overdue}</p>
        </div>
        <div className="border rounded-lg p-4">
          <p className="text-sm text-muted-foreground">Completed</p>
          <p className="text-2xl font-bold">{data.completed}</p>
        </div>
      </div>
      <div className="border rounded-lg p-4">
        <p className="text-sm text-muted-foreground">Completion Rate</p>
        <p className="text-2xl font-bold">{data.completionRate.toFixed(1)}%</p>
      </div>
      <div className="border rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/40">
            <tr>
              <th className="text-left px-4 py-3 font-medium">Type</th>
              <th className="text-left px-4 py-3 font-medium">Count</th>
              <th className="text-left px-4 py-3 font-medium">Completed</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {data.byType.map((t) => (
              <tr key={t.type} className="hover:bg-muted/20">
                <td className="px-4 py-3 capitalize">{t.type}</td>
                <td className="px-4 py-3">{t.count}</td>
                <td className="px-4 py-3">{t.completed}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="border rounded-lg p-4">
        <p className="text-sm text-muted-foreground mb-2">Contact Stats</p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <p className="text-sm text-muted-foreground">Total Contacts</p>
            <p className="text-xl font-bold">{data.contactStats.totalContacts}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">SMS Sent</p>
            <p className="text-xl font-bold">{data.contactStats.smsSent}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Email Sent</p>
            <p className="text-xl font-bold">{data.contactStats.emailSent}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Phone Calls</p>
            <p className="text-xl font-bold">{data.contactStats.phoneCalls}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
