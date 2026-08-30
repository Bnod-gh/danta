import { useQuery } from '@tanstack/react-query';
import { CreditCard } from 'lucide-react';

type Invoice = {
  id: string;
  invoiceNumber: string;
  status: string;
  total: number;
  balance: number;
  issueDate: string;
  dueDate: string;
  items: { description: string; quantity: number; total: number }[];
};

export function PatientPortalBilling() {
  const { data: invoices, isLoading } = useQuery({
    queryKey: ['patient-portal', 'invoices'],
    queryFn: async () => {
      const token = localStorage.getItem('patientAccessToken');
      const res = await fetch('/api/v1/patient-portal/invoices', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Failed to fetch invoices');
      return res.json() as Promise<Invoice[]>;
    },
  });

  if (isLoading) return <div className="text-center py-12 text-muted-foreground">Loading...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <CreditCard className="w-6 h-6" />
        <h1 className="text-2xl font-bold">My Billing</h1>
      </div>
      {!invoices || invoices.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">No invoices found</div>
      ) : (
        <div className="border rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/40">
              <tr>
                <th className="text-left px-4 py-3 font-medium">Invoice</th>
                <th className="text-left px-4 py-3 font-medium">Date</th>
                <th className="text-left px-4 py-3 font-medium">Status</th>
                <th className="text-left px-4 py-3 font-medium">Total</th>
                <th className="text-left px-4 py-3 font-medium">Balance</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {invoices.map((inv) => (
                <tr key={inv.id} className="hover:bg-muted/20">
                  <td className="px-4 py-3">{inv.invoiceNumber}</td>
                  <td className="px-4 py-3">{new Date(inv.issueDate).toLocaleDateString()}</td>
                  <td className="px-4 py-3">
                    <span className="px-2 py-1 bg-primary/10 rounded-full text-xs font-medium capitalize">{inv.status}</span>
                  </td>
                  <td className="px-4 py-3">${inv.total.toLocaleString()}</td>
                  <td className="px-4 py-3">${inv.balance.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
