import { createFileRoute } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { TrendingUp } from 'lucide-react';

export const Route = createFileRoute('/reports/revenue/')({
  component: RevenuePage,
});

type RevenueReport = {
  totalRevenue: number;
  totalInvoices: number;
  totalPayments: number;
  totalRefunds: number;
  outstandingBalance: number;
  byProvider: { providerId: string; providerName: string; revenue: number; appointments: number }[];
  byService: { serviceId: string; serviceName: string; revenue: number; count: number }[];
  daily: { date: string; revenue: number; payments: number; invoices: number }[];
};

export function RevenuePage() {
  const { data, isLoading } = useQuery({
    queryKey: ['reports', 'revenue'],
    queryFn: async () => {
      const res = await fetch('/api/v1/reports/revenue');
      if (!res.ok) throw new Error('Failed to fetch revenue report');
      return res.json() as Promise<RevenueReport>;
    },
  });

  if (isLoading) return <div className="text-center py-12 text-muted-foreground">Loading...</div>;
  if (!data) return null;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <TrendingUp className="w-6 h-6" />
        <h1 className="text-2xl font-bold">Revenue Report</h1>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="border rounded-lg p-4">
          <p className="text-sm text-muted-foreground">Total Revenue</p>
          <p className="text-2xl font-bold">${data.totalRevenue.toLocaleString()}</p>
        </div>
        <div className="border rounded-lg p-4">
          <p className="text-sm text-muted-foreground">Total Invoices</p>
          <p className="text-2xl font-bold">{data.totalInvoices}</p>
        </div>
        <div className="border rounded-lg p-4">
          <p className="text-sm text-muted-foreground">Total Refunds</p>
          <p className="text-2xl font-bold">${data.totalRefunds.toLocaleString()}</p>
        </div>
        <div className="border rounded-lg p-4">
          <p className="text-sm text-muted-foreground">Outstanding</p>
          <p className="text-2xl font-bold">${data.outstandingBalance.toLocaleString()}</p>
        </div>
      </div>
      <div className="border rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/40">
            <tr>
              <th className="text-left px-4 py-3 font-medium">Provider</th>
              <th className="text-left px-4 py-3 font-medium">Revenue</th>
              <th className="text-left px-4 py-3 font-medium">Appointments</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {data.byProvider.map((p) => (
              <tr key={p.providerId} className="hover:bg-muted/20">
                <td className="px-4 py-3">{p.providerName}</td>
                <td className="px-4 py-3">${p.revenue.toLocaleString()}</td>
                <td className="px-4 py-3">{p.appointments}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="border rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/40">
            <tr>
              <th className="text-left px-4 py-3 font-medium">Service</th>
              <th className="text-left px-4 py-3 font-medium">Revenue</th>
              <th className="text-left px-4 py-3 font-medium">Count</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {data.byService.map((s) => (
              <tr key={s.serviceId} className="hover:bg-muted/20">
                <td className="px-4 py-3">{s.serviceName}</td>
                <td className="px-4 py-3">${s.revenue.toLocaleString()}</td>
                <td className="px-4 py-3">{s.count}</td>
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
              <th className="text-left px-4 py-3 font-medium">Revenue</th>
              <th className="text-left px-4 py-3 font-medium">Payments</th>
              <th className="text-left px-4 py-3 font-medium">Invoices</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {data.daily.map((d) => (
              <tr key={d.date} className="hover:bg-muted/20">
                <td className="px-4 py-3">{d.date}</td>
                <td className="px-4 py-3">${d.revenue.toLocaleString()}</td>
                <td className="px-4 py-3">{d.payments}</td>
                <td className="px-4 py-3">{d.invoices}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
