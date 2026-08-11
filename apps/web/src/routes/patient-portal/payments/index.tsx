import { createFileRoute } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { Receipt } from 'lucide-react';

export const Route = createFileRoute('/patient-portal/payments/')({
  component: PatientPortalPayments,
});

type Payment = {
  id: string;
  method: string;
  amount: number;
  currency: string;
  status: string;
  reference: string | null;
  receivedAt: string;
};

export function PatientPortalPayments() {
  const { data: payments, isLoading } = useQuery({
    queryKey: ['patient-portal', 'payments'],
    queryFn: async () => {
      const token = localStorage.getItem('patientAccessToken');
      const res = await fetch('/api/v1/patient-portal/payments', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Failed to fetch payments');
      return res.json() as Promise<Payment[]>;
    },
  });

  if (isLoading) return <div className="text-center py-12 text-muted-foreground">Loading...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Receipt className="w-6 h-6" />
        <h1 className="text-2xl font-bold">My Payments</h1>
      </div>
      {!payments || payments.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">No payments found</div>
      ) : (
        <div className="border rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/40">
              <tr>
                <th className="text-left px-4 py-3 font-medium">Date</th>
                <th className="text-left px-4 py-3 font-medium">Method</th>
                <th className="text-left px-4 py-3 font-medium">Amount</th>
                <th className="text-left px-4 py-3 font-medium">Status</th>
                <th className="text-left px-4 py-3 font-medium">Reference</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {payments.map((p) => (
                <tr key={p.id} className="hover:bg-muted/20">
                  <td className="px-4 py-3">{new Date(p.receivedAt).toLocaleDateString()}</td>
                  <td className="px-4 py-3 capitalize">{p.method}</td>
                  <td className="px-4 py-3">${p.amount.toLocaleString()}</td>
                  <td className="px-4 py-3">
                    <span className="px-2 py-1 bg-primary/10 rounded-full text-xs font-medium capitalize">{p.status}</span>
                  </td>
                  <td className="px-4 py-3">{p.reference || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
