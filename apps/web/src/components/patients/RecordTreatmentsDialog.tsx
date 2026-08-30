import { useMemo, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Stethoscope } from 'lucide-react';
import { Button } from '@danta/ui/button';
import { Checkbox } from '@danta/ui/checkbox-radix';
import { Input } from '@danta/ui/input';
import { Label } from '@danta/ui/label';
import { Skeleton } from '@danta/ui/skeleton';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@danta/ui/dialog';
import { toast } from 'sonner';
import { getPerformablePlanItems, performTreatments, type PlanItemVM } from '../../lib/api/treatment-execution';

function money(value: number | string): string {
  return Number(value).toLocaleString('en-AU', { style: 'currency', currency: 'AUD' });
}

function itemPrice(item: PlanItemVM): number {
  return Number(item.unitPrice) * item.quantity - Number(item.discount);
}

export function RecordTreatmentsDialog({ appointmentId, patientId, open, onOpenChange }: {
  appointmentId: string;
  patientId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const queryClient = useQueryClient();
  const [selected, setSelected] = useState<Record<string, boolean>>({});
  const [createInvoice, setCreateInvoice] = useState(true);
  const [taxRate, setTaxRate] = useState('10');
  const [saving, setSaving] = useState(false);

  const { data: items, isLoading } = useQuery({
    queryKey: ['performable-plan-items', patientId],
    queryFn: () => getPerformablePlanItems(patientId),
    enabled: open && Boolean(patientId),
  });

  const selectedItems = useMemo(() => (items ?? []).filter((item) => selected[item.id]), [items, selected]);
  const estimatedTotal = selectedItems.reduce((sum, item) => sum + itemPrice(item), 0);
  const gstAmount = createInvoice ? estimatedTotal * (Number(taxRate) || 0) / 100 : 0;

  const submit = async () => {
    if (selectedItems.length === 0) {
      toast.error('Select at least one treatment to record');
      return;
    }
    setSaving(true);
    try {
      const result = await performTreatments(appointmentId, {
        items: selectedItems.map((item) => ({ planItemId: item.id })),
        createInvoice,
        taxRate: Number(taxRate) || 0,
      });
      const invoiceNote = result.invoice ? ` Invoice ${result.invoice.invoiceNumber} created.` : '';
      const recallNote = result.recall ? ' Follow-up recall scheduled.' : '';
      toast.success(`Recorded ${result.treatments.length} treatment${result.treatments.length === 1 ? '' : 's'}.${invoiceNote}${recallNote}`);
      queryClient.invalidateQueries({ queryKey: ['treatment-plans'] });
      queryClient.invalidateQueries({ queryKey: ['patient-timeline'] });
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      queryClient.invalidateQueries({ queryKey: ['estimates'] });
      setSelected({});
      onOpenChange(false);
    } catch (error) {
      toast.error(error instanceof Error && error.message ? error.message : 'Could not record the treatments');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><Stethoscope className="h-5 w-5" /> Record treatments performed</DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="space-y-2">{[0, 1, 2].map((i) => <Skeleton key={i} className="h-10 w-full" />)}</div>
        ) : !items || items.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">
            No accepted or scheduled plan items for this patient — chart findings and generate a plan first.
          </p>
        ) : (
          <>
            <ul className="max-h-64 space-y-1 overflow-y-auto rounded-md border p-2" aria-label="Treatments to record">
              {items.map((item) => (
                <li key={item.id}>
                  <label className="flex cursor-pointer items-center justify-between gap-3 rounded px-2 py-1.5 hover:bg-muted">
                    <span className="flex items-center gap-2 text-sm">
                      <Checkbox
                        checked={Boolean(selected[item.id])}
                        onCheckedChange={(checked) => setSelected((current) => ({ ...current, [item.id]: Boolean(checked) }))}
                        aria-label={`Record ${item.description}`}
                      />
                      <span>
                        {item.description}
                        {item.toothNumber ? <span className="text-muted-foreground"> · tooth {item.toothNumber}</span> : null}
                        {item.surfaces?.length ? <span className="text-xs text-muted-foreground"> ({item.surfaces.join(', ')})</span> : null}
                      </span>
                    </span>
                    <span className="text-sm tabular-nums">{money(itemPrice(item))}</span>
                  </label>
                </li>
              ))}
            </ul>

            <div className="flex items-center justify-between rounded-md border px-3 py-2">
              <div className="flex items-center gap-2">
                <Checkbox id="create-invoice" checked={createInvoice} onCheckedChange={(checked) => setCreateInvoice(Boolean(checked))} />
                <Label htmlFor="create-invoice" className="text-sm">Generate invoice</Label>
              </div>
              {createInvoice && (
                <div className="flex items-center gap-2">
                  <Label htmlFor="gst-rate" className="text-xs text-muted-foreground">GST %</Label>
                  <Input
                    id="gst-rate"
                    type="number"
                    min={0}
                    max={100}
                    value={taxRate}
                    onChange={(event) => setTaxRate(event.target.value)}
                    className="h-8 w-20"
                  />
                </div>
              )}
            </div>

            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">
                {selectedItems.length} selected{createInvoice ? ` · incl. ${money(gstAmount)} GST` : ''}
              </span>
              <span className="font-medium tabular-nums">{money(estimatedTotal + gstAmount)}</span>
            </div>
          </>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>Cancel</Button>
          <Button onClick={submit} disabled={saving || isLoading || !items || items.length === 0}>
            {saving ? 'Recording…' : `Record ${selectedItems.length || ''} treatment${selectedItems.length === 1 ? '' : 's'}`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
