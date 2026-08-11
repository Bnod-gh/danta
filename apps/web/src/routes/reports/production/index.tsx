import { createFileRoute } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { Stethoscope } from 'lucide-react';

export const Route = createFileRoute('/reports/production/')({
  component: ProductionPage,
});

type ProductionReport = {
  totalProduction: number;
  totalTreatments: number;
  byProvider: { providerId: string; providerName: string; production: number; treatments: number }[];
  byTreatment: { treatment: string; count: number; totalCost: number }[];
  daily: { date: string; production: number; treatments: number }[];
};

export function ProductionPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['reports', 'production'],
    queryFn: async () => {
      const res = await fetch('/api/v1/reports/production');
      if (!res.ok) throw new Error('Failed to fetch production report');
      return res.json() as Promise<ProductionReport>;
    },
  });

  if (isLoading) return <div className="text-center py-12 text-muted-foreground">Loading...</div>;
  if (!data) return null;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Stethoscope className="w-6 h-6" />
        <h1 className="text-2xl font-bold">Production Report</h1>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="border rounded-lg p-4">
          <p className="text-sm text-muted-foreground">Total Production</p>
          <p className="text-2xl font-bold">${data.totalProduction.toLocaleString()}</p>
        </div>
        <div className="border rounded-lg p-4">
          <p className="text-sm text-muted-foreground">Total Treatments</p>
          <p className="text-2xl font-bold">{data.totalTreatments}</p>
        </div>
      </div>
      <div className="border rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/40">
            <tr>
              <th className="text-left px-4 py-3 font-medium">Provider</th>
              <th className="text-left px-4 py-3 font-medium">Production</th>
              <th className="text-left px-4 py-3 font-medium">Treatments</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {data.byProvider.map((p) => (
              <tr key={p.providerId} className="hover:bg-muted/20">
                <td className="px-4 py-3">{p.providerName}</td>
                <td className="px-4 py-3">${p.production.toLocaleString()}</td>
                <td className="px-4 py-3">{p.treatments}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="border rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/40">
            <tr>
              <th className="text-left px-4 py-3 font-medium">Treatment</th>
              <th className="text-left px-4 py-3 font-medium">Count</th>
              <th className="text-left px-4 py-3 font-medium">Total Cost</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {data.byTreatment.map((t) => (
              <tr key={t.treatment} className="hover:bg-muted/20">
                <td className="px-4 py-3">{t.treatment}</td>
                <td className="px-4 py-3">{t.count}</td>
                <td className="px-4 py-3">${t.totalCost.toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="border rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/40">
            <tr>
              <th className="text-left px-4 py-3 font-medium">Date</th>
              <th className="text-left px-4 py-3 font-medium">Production</th>
              <th className="text-left px-4 py-3 font-medium">Treatments</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {data.daily.map((d) => (
              <tr key={d.date} className="hover:bg-muted/20">
                <td className="px-4 py-3">{d.date}</td>
                <td className="px-4 py-3">${d.production.toLocaleString()}</td>
                <td className="px-4 py-3">{d.treatments}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
