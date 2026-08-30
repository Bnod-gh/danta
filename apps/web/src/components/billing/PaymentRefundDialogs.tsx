import { useEffect, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Banknote } from 'lucide-react';
import { Button } from '@danta/ui/button';
import { Input } from '@danta/ui/input';
import { Label } from '@danta/ui/label';
import { Skeleton } from '@danta/ui/skeleton';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@danta/ui/dialog';
import { toast } from 'sonner';
import { allocatePayment, createPayment, createRefund, getPayments } from '../../lib/api/billing-payments';

const METHODS = [
  { value: 'eftpos', label: 'EFTPOS' },
  { value: 'hicaps', label: 'HICAPS' },
  { value: 'cash', label: 'Cash' },
  { value: 'credit_card', label: 'Credit card' },
  { value: 'debit_card', label: 'Debit card' },
  { value: 'bank_transfer', label: 'Bank transfer' },
] as const;

export function RecordPaymentDialog({ invoice, open, onOpenChange }: {
  invoice: { id: string; invoiceNumber: string; patientId: string; patientName: string; balance: number };
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const queryClient = useQueryClient();
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState<(typeof METHODS)[number]['value']>('eftpos');
  const [reference, setReference] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setAmount(invoice.balance.toFixed(2));
      setMethod('eftpos');
      setReference('');
    }
  }, [open, invoice]);

  const submit = async () => {
    const value = Number(amount);
    if (!Number.isFinite(value) || value <= 0) {
      toast.error('Enter a payment amount greater than zero');
      return;
    }
    if (value > invoice.balance + 0.001) {
      toast.error(`The amount exceeds the outstanding balance (${invoice.balance.toFixed(2)})`);
      return;
    }
    setSaving(true);
    try {
      const payment = await createPayment({
        patientId: invoice.patientId,
        method,
        amount: value,
        ...(reference.trim() ? { reference: reference.trim() } : {}),
      });
      await allocatePayment(payment.id, invoice.id, value);
      toast.success(`Recorded ${value.toFixed(2)} against ${invoice.invoiceNumber}`);
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      queryClient.invalidateQueries({ queryKey: ['patient-timeline'] });
      onOpenChange(false);
    } catch (error) {
      toast.error(error instanceof Error && error.message ? error.message : 'Could not record the payment');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><Banknote className="h-5 w-5" /> Record payment — {invoice.invoiceNumber}</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">{invoice.patientName} · balance {invoice.balance.toFixed(2)}</p>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="pay-amount">Amount (AUD)</Label>
            <Input id="pay-amount" type="number" min={0.01} step={0.01} value={amount} onChange={(e) => setAmount(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="pay-method">Method</Label>
            <select
              id="pay-method"
              value={method}
              onChange={(e) => setMethod(e.target.value as typeof method)}
              className="h-10 w-full px-3 border rounded-md text-sm bg-background"
            >
              {METHODS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
            </select>
          </div>
          <div className="col-span-2 space-y-1.5">
            <Label htmlFor="pay-reference">Reference</Label>
            <Input id="pay-reference" value={reference} onChange={(e) => setReference(e.target.value)} placeholder="Receipt or terminal reference (optional)" />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>Cancel</Button>
          <Button onClick={submit} disabled={saving}>{saving ? 'Recording…' : 'Record payment'}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function RefundPaymentDialog({ invoice, open, onOpenChange }: {
  invoice: { id: string; invoiceNumber: string; patientId: string; patientName: string; total: number };
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const queryClient = useQueryClient();
  const [paymentId, setPaymentId] = useState('');
  const [amount, setAmount] = useState('');
  const [reason, setReason] = useState('');
  const [saving, setSaving] = useState(false);

  const paymentsQuery = useQuery({
    queryKey: ['payments-for-refund', invoice?.patientId],
    queryFn: () => getPayments({ patientId: invoice.patientId, take: 50 }),
    enabled: open,
  });
  const payments = (paymentsQuery.data ?? []).filter((payment) => payment.status === 'completed');

  useEffect(() => {
    if (open) {
      setPaymentId(payments[0]?.id ?? '');
      setAmount('');
      setReason('');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, payments.length]);

  const submit = async () => {
    const value = Number(amount);
    if (!paymentId) {
      toast.error('Select the payment to refund');
      return;
    }
    if (!Number.isFinite(value) || value <= 0) {
      toast.error('Enter a refund amount greater than zero');
      return;
    }
    setSaving(true);
    try {
      await createRefund({ paymentId, invoiceId: invoice.id, amount: value, ...(reason.trim() ? { reason: reason.trim() } : {}) });
      toast.success('Refund recorded');
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      queryClient.invalidateQueries({ queryKey: ['refunds'] });
      queryClient.invalidateQueries({ queryKey: ['patient-timeline'] });
      onOpenChange(false);
    } catch (error) {
      toast.error(error instanceof Error && error.message ? error.message : 'Could not record the refund');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Refund — {invoice.invoiceNumber}</DialogTitle>
        </DialogHeader>
        {paymentsQuery.isLoading ? (
          <Skeleton className="h-10 w-full" />
        ) : payments.length === 0 ? (
          <p className="py-4 text-center text-sm text-muted-foreground">No completed payments found for this patient.</p>
        ) : (
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="refund-payment">Payment</Label>
              <select
                id="refund-payment"
                value={paymentId}
                onChange={(e) => setPaymentId(e.target.value)}
                className="h-10 w-full px-3 border rounded-md text-sm bg-background"
              >
                {payments.map((payment) => (
                  <option key={payment.id} value={payment.id}>
                    {new Date(payment.receivedAt).toLocaleDateString('en-AU')} · {payment.method} · {Number(payment.amount).toFixed(2)}
                  </option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="refund-amount">Amount (AUD)</Label>
                <Input id="refund-amount" type="number" min={0.01} step={0.01} value={amount} onChange={(e) => setAmount(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="refund-reason">Reason</Label>
                <Input id="refund-reason" value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Why is this being refunded?" />
              </div>
            </div>
          </div>
        )}
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>Cancel</Button>
          <Button variant="destructive" onClick={submit} disabled={saving || payments.length === 0}>
            {saving ? 'Recording…' : 'Record refund'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
