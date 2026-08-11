import { createFileRoute } from '@tanstack/react-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { Plus } from 'lucide-react';
import { cn } from '@danta/ui';

export const Route = createFileRoute('/refunds/')({
  component: RefundsPage,
});

type RefundRecord = {
  id: string;
  paymentId: string;
  invoiceId?: string;
  invoice?: { id: string; invoiceNumber: string };
  amount: number;
  reason?: string;
  status: string;
};

type InvoiceOption = { id: string; invoiceNumber: string };

export function RefundsPage() {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [paymentId, setPaymentId] = useState('');
  const [invoiceId, setInvoiceId] = useState('');
  const [amount, setAmount] = useState('');
  const [reason, setReason] = useState('');

  const { data: refunds, isLoading } = useQuery({
    queryKey: ['refunds'],
    queryFn: async () => {
      const res = await fetch('/api/v1/refunds');
      if (!res.ok) throw new Error('Failed to fetch refunds');
      return res.json() as Promise<RefundRecord[]>;
    },
  });

  const { data: payments } = useQuery({
    queryKey: ['payments-list'],
    queryFn: async () => {
      const res = await fetch('/api/v1/payments');
      if (!res.ok) throw new Error('Failed to fetch payments');
      return res.json() as Promise<{ id: string; amount: number; method: string }[]>;
    },
  });

  const { data: invoices } = useQuery({
    queryKey: ['invoices-list'],
    queryFn: async () => {
      const res = await fetch('/api/v1/invoices');
      if (!res.ok) throw new Error('Failed to fetch invoices');
      return res.json() as Promise<InvoiceOption[]>;
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await fetch('/api/v1/refunds', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error('Failed to create refund');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['refunds'] });
      resetForm();
    },
  });

  const resetForm = () => {
    setPaymentId('');
    setInvoiceId('');
    setAmount('');
    setReason('');
    setShowForm(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate({
      paymentId,
      invoiceId: invoiceId || undefined,
      amount: Number(amount),
      reason: reason || undefined,
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Refunds</h1>
          <p className="text-muted-foreground">Manage payment refunds</p>
        </div>
        <button
          onClick={() => { resetForm(); setShowForm(true); }}
          className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium"
        >
          <Plus className="w-4 h-4" />
          New Refund
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="border rounded-lg p-4 space-y-4">
          <h3 className="font-medium">New Refund</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Payment</label>
              <select value={paymentId} onChange={(e) => setPaymentId(e.target.value)} className="w-full px-3 py-2 border rounded-md text-sm" required>
                <option value="">Select payment</option>
                {payments?.map((p) => (
                  <option key={p.id} value={p.id}>${p.amount.toFixed(2)} - {p.method}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Invoice (optional)</label>
              <select value={invoiceId} onChange={(e) => setInvoiceId(e.target.value)} className="w-full px-3 py-2 border rounded-md text-sm">
                <option value="">Select invoice</option>
                {invoices?.map((inv) => (
                  <option key={inv.id} value={inv.id}>{inv.invoiceNumber}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Amount</label>
              <input type="number" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} className="w-full px-3 py-2 border rounded-md text-sm" required />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Reason</label>
              <input value={reason} onChange={(e) => setReason(e.target.value)} className="w-full px-3 py-2 border rounded-md text-sm" />
            </div>
          </div>
          <div className="flex gap-2">
            <button type="submit" className="px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm">Create</button>
            <button type="button" onClick={resetForm} className="px-4 py-2 border rounded-md text-sm">Cancel</button>
          </div>
        </form>
      )}

      {isLoading ? (
        <div className="text-center py-12 text-muted-foreground">Loading...</div>
      ) : (
        <div className="border rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/40">
              <tr>
                <th className="text-left px-4 py-3 font-medium">Amount</th>
                <th className="text-left px-4 py-3 font-medium">Reason</th>
                <th className="text-left px-4 py-3 font-medium">Status</th>
                <th className="text-left px-4 py-3 font-medium">Invoice</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {refunds?.map((r) => (
                <tr key={r.id} className="hover:bg-muted/20">
                  <td className="px-4 py-3">${r.amount.toFixed(2)}</td>
                  <td className="px-4 py-3">{r.reason || '-'}</td>
                  <td className="px-4 py-3">
                    <span className={cn('px-2 py-1 rounded-full text-xs font-medium', r.status === 'completed' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800')}>
                      {r.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">{r.invoice?.invoiceNumber || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
