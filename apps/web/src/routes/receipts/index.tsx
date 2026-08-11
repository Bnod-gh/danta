import { createFileRoute } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { FileText } from 'lucide-react';

export const Route = createFileRoute('/receipts/')({
  component: ReceiptsPage,
});

type ReceiptView = {
  id: string;
  paymentId: string;
  receiptNumber: string;
  amount: number;
  currency: string;
  method: string;
  patientId: string;
  issuedAt: string;
  patient: { id: string; firstName: string; lastName: string; patientNumber: string };
  allocations: { invoice: { id: string; invoiceNumber: string } }[];
  reference?: string;
};

type PaymentOption = { id: string; amount: number; method: string };

export function ReceiptsPage() {
  const [paymentId, setPaymentId] = useState('');
  const [receipt, setReceipt] = useState<ReceiptView | null>(null);

  const { data: payments } = useQuery({
    queryKey: ['payments-list'],
    queryFn: async () => {
      const res = await fetch('/api/v1/payments');
      if (!res.ok) throw new Error('Failed to fetch payments');
      return res.json() as Promise<PaymentOption[]>;
    },
  });

  const handleGenerate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!paymentId) return;
    fetch(`/api/v1/receipts/${paymentId}`)
      .then((res) => res.json())
      .then((data) => setReceipt(data))
      .catch(() => {});
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Receipts</h1>
        <p className="text-muted-foreground">Generate payment receipts</p>
      </div>

      <form onSubmit={handleGenerate} className="border rounded-lg p-4 space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Payment</label>
          <select value={paymentId} onChange={(e) => setPaymentId(e.target.value)} className="w-full px-3 py-2 border rounded-md text-sm" required>
            <option value="">Select payment</option>
            {payments?.map((p) => (
              <option key={p.id} value={p.id}>${p.amount.toFixed(2)} - {p.method}</option>
            ))}
          </select>
        </div>
        <button type="submit" className="px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm">Generate Receipt</button>
      </form>

      {receipt && (
        <div className="border rounded-lg p-6 space-y-4 max-w-2xl">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold">Receipt {receipt.receiptNumber}</h3>
              <p className="text-sm text-muted-foreground">Issued {new Date(receipt.issuedAt).toLocaleString()}</p>
            </div>
            <FileText className="w-8 h-8 text-muted-foreground" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Patient</p>
              <p className="font-medium">{receipt.patient.firstName} {receipt.patient.lastName}</p>
              <p className="text-sm text-muted-foreground">{receipt.patient.patientNumber}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Amount</p>
              <p className="text-lg font-medium">${receipt.amount.toFixed(2)} {receipt.currency}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Payment Method</p>
              <p className="font-medium capitalize">{receipt.method.replace('_', ' ')}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Reference</p>
              <p className="font-medium">{receipt.reference || '-'}</p>
            </div>
          </div>

          {receipt.allocations.length > 0 && (
            <div>
              <h4 className="font-medium mb-2">Applied To</h4>
              <table className="w-full text-sm">
                <thead className="bg-muted/40">
                  <tr>
                    <th className="text-left px-4 py-2 font-medium">Invoice</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {receipt.allocations.map((alloc) => (
                    <tr key={alloc.invoice.id} className="hover:bg-muted/20">
                      <td className="px-4 py-2">{alloc.invoice.invoiceNumber}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
