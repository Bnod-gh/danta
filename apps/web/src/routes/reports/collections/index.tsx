import { createFileRoute } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { FileText } from 'lucide-react';

export const Route = createFileRoute('/reports/collections/')({
  component: CollectionsPage,
});

type CollectionsReport = {
  totalBilled: number;
  totalCollected: number;
  totalOutstanding: number;
  totalOverdue: number;
  collectionRate: number;
  byStatus: { status: string; count: number; amount: number }[];
  byAge: { age: string; count: number; amount: number }[];
};

export function CollectionsPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['reports', 'collections'],
    queryFn: async () => {
      const res = await fetch('/api/v1/reports/collections');
      if (!res.ok) throw new Error('Failed to fetch collections report');
      return res.json() as Promise<CollectionsReport>;
    },
  });

  if (isLoading) return <div className="text-center py-12 text-muted-foreground">Loading...</div>;
  if (!data) return null;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <FileText className="w-6 h-6" />
        <h1 className="text-2xl font-bold">Collections Report</h1>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="border rounded-lg p-4">
          <p className="text-sm text-muted-foreground">Total Billed</p>
          <p className="text-2xl font-bold">${data.totalBilled.toLocaleString()}</p>
        </div>
        <div className="border rounded-lg p-4">
          <p className="text-sm text-muted-foreground">Total Collected</p>
          <p className="text-2xl font-bold">${data.totalCollected.toLocaleString()}</p>
        </div>
        <div className="border rounded-lg p-4">
          <p className="text-sm text-muted-foreground">Outstanding</p>
          <p className="text-2xl font-bold">${data.totalOutstanding.toLocaleString()}</p>
        </div>
        <div className="border rounded-lg p-4">
          <p className="text-sm text-muted-foreground">Overdue</p>
          <p className="text-2xl font-bold">${data.totalOverdue.toLocaleString()}</p>
        </div>
      </div>
      <div className="border rounded-lg p-4">
        <p className="text-sm text-muted-foreground">Collection Rate</p>
        <p className="text-2xl font-bold">{data.collectionRate.toFixed(1)}%</p>
      </div>
      <div className="border rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/40">
            <tr>
              <th className="text-left px-4 py-3 font-medium">Status</th>
              <th className="text-left px-4 py-3 font-medium">Count</th>
              <th className="text-left px-4 py-3 font-medium">Amount</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {data.byStatus.map((s) => (
              <tr key={s.status} className="hover:bg-muted/20">
                <td className="px-4 py-3 capitalize">{s.status}</td>
                <td className="px-4 py-3">{s.count}</td>
                <td className="px-4 py-3">${s.amount.toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="border rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/40">
            <tr>
              <th className="text-left px-4 py-3 font-medium">Age</th>
              <th className="text-left px-4 py-3 font-medium">Count</th>
              <th className="text-left px-4 py-3 font-medium">Amount</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {data.byAge.map((a) => (
              <tr key={a.age} className="hover:bg-muted/20">
                <td className="px-4 py-3">{a.age}</td>
                <td className="px-4 py-3">{a.count}</td>
                <td className="px-4 py-3">${a.amount.toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
