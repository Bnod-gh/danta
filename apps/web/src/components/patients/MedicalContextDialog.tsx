import { useEffect, useState } from 'react';
import { Button } from '@danta/ui/button';
import { Input } from '@danta/ui/input';
import { Label } from '@danta/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@danta/ui/dialog';
import { upsertMedicalContext, type PatientMedicalContext } from '../../lib/api/patient-clinical';
import { toast } from 'sonner';

interface MedicalContextDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  patientId: string;
  context: PatientMedicalContext | undefined;
  onSaved: () => void;
}

function toDateInput(value: string | null): string {
  if (!value) return '';
  const date = new Date(value);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

export function MedicalContextDialog({ open, onOpenChange, patientId, context, onSaved }: MedicalContextDialogProps) {
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    isPregnant: false,
    pregnancyWeek: '',
    isLactating: false,
    isOnAnticoagulants: false,
    anticoagulantMedication: '',
    inrValue: '',
    lastInrDate: '',
    isSmoker: false,
    smokingFrequency: '',
    alcoholConsumption: '',
    bruxism: false,
    adverseAnesthesiaReaction: false,
    anesthesiaReactionDetails: '',
  });

  useEffect(() => {
    if (open) {
      setForm({
        isPregnant: context?.isPregnant ?? false,
        pregnancyWeek: context?.pregnancyWeek != null ? String(context.pregnancyWeek) : '',
        isLactating: context?.isLactating ?? false,
        isOnAnticoagulants: context?.isOnAnticoagulants ?? false,
        anticoagulantMedication: context?.anticoagulantMedication ?? '',
        inrValue: context?.inrValue != null ? String(context.inrValue) : '',
        lastInrDate: toDateInput(context?.lastInrDate ?? null),
        isSmoker: context?.isSmoker ?? false,
        smokingFrequency: context?.smokingFrequency ?? '',
        alcoholConsumption: context?.alcoholConsumption ?? '',
        bruxism: context?.bruxism ?? false,
        adverseAnesthesiaReaction: context?.adverseAnesthesiaReaction ?? false,
        anesthesiaReactionDetails: context?.anesthesiaReactionDetails ?? '',
      });
    }
  }, [open, context]);

  const set = (key: keyof typeof form) => (value: string | boolean) =>
    setForm((current) => ({ ...current, [key]: value }));

  const handleSave = async () => {
    const pregnancyWeek = form.pregnancyWeek.trim() ? Number(form.pregnancyWeek) : null;
    if (form.isPregnant && (pregnancyWeek == null || !Number.isInteger(pregnancyWeek) || pregnancyWeek < 1 || pregnancyWeek > 42)) {
      toast.error('Pregnancy week must be between 1 and 42');
      return;
    }
    const inrValue = form.inrValue.trim() ? Number(form.inrValue) : null;
    if (inrValue != null && (!Number.isFinite(inrValue) || inrValue <= 0)) {
      toast.error('INR must be a positive number');
      return;
    }

    setSaving(true);
    try {
      await upsertMedicalContext(patientId, {
        isPregnant: form.isPregnant,
        pregnancyWeek: form.isPregnant ? pregnancyWeek : null,
        isLactating: form.isLactating,
        isOnAnticoagulants: form.isOnAnticoagulants,
        anticoagulantMedication: form.isOnAnticoagulants && form.anticoagulantMedication.trim() ? form.anticoagulantMedication.trim() : null,
        inrValue: form.isOnAnticoagulants && inrValue != null ? inrValue : null,
        lastInrDate: form.isOnAnticoagulants && form.lastInrDate ? new Date(`${form.lastInrDate}T00:00:00`) : null,
        isSmoker: form.isSmoker,
        smokingFrequency: form.isSmoker && form.smokingFrequency.trim() ? form.smokingFrequency.trim() : null,
        alcoholConsumption: form.alcoholConsumption.trim() || null,
        bruxism: form.bruxism,
        adverseAnesthesiaReaction: form.adverseAnesthesiaReaction,
        anesthesiaReactionDetails:
          form.adverseAnesthesiaReaction && form.anesthesiaReactionDetails.trim() ? form.anesthesiaReactionDetails.trim() : null,
      });
      toast.success('Clinical context saved');
      onOpenChange(false);
      onSaved();
    } catch {
      toast.error('Failed to save clinical context');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Clinical context</DialogTitle>
          <DialogDescription>Systemic flags that surface as medical alerts across the schedule and charting.</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid gap-2 sm:grid-cols-2">
            <CheckboxRow id="ctx-pregnant" label="Pregnant" checked={form.isPregnant} onChange={set('isPregnant')} />
            {form.isPregnant && (
              <div className="space-y-1.5">
                <Label htmlFor="ctx-pregnancy-week">Week</Label>
                <Input id="ctx-pregnancy-week" type="number" min={1} max={42} value={form.pregnancyWeek} onChange={(event) => set('pregnancyWeek')(event.target.value)} />
              </div>
            )}
            <CheckboxRow id="ctx-lactating" label="Lactating" checked={form.isLactating} onChange={set('isLactating')} />
            <CheckboxRow id="ctx-bruxism" label="Bruxism" checked={form.bruxism} onChange={set('bruxism')} />
          </div>

          <div className="space-y-2 rounded-md border p-3">
            <CheckboxRow
              id="ctx-anticoag"
              label="On anticoagulants"
              checked={form.isOnAnticoagulants}
              onChange={set('isOnAnticoagulants')}
            />
            {form.isOnAnticoagulants && (
              <div className="grid gap-2 sm:grid-cols-3">
                <div className="space-y-1.5 sm:col-span-3">
                  <Label htmlFor="ctx-anticoag-med">Medication</Label>
                  <Input id="ctx-anticoag-med" placeholder="e.g. Warfarin 5mg" value={form.anticoagulantMedication} onChange={(event) => set('anticoagulantMedication')(event.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="ctx-inr">Latest INR</Label>
                  <Input id="ctx-inr" type="number" step="0.1" min={0} value={form.inrValue} onChange={(event) => set('inrValue')(event.target.value)} />
                </div>
                <div className="space-y-1.5 sm:col-span-2">
                  <Label htmlFor="ctx-inr-date">INR date</Label>
                  <Input id="ctx-inr-date" type="date" value={form.lastInrDate} onChange={(event) => set('lastInrDate')(event.target.value)} />
                </div>
              </div>
            )}
          </div>

          <div className="space-y-2 rounded-md border p-3">
            <CheckboxRow id="ctx-smoker" label="Smoker" checked={form.isSmoker} onChange={set('isSmoker')} />
            {form.isSmoker && (
              <div className="space-y-1.5">
                <Label htmlFor="ctx-smoke-freq">Frequency</Label>
                <Input id="ctx-smoke-freq" placeholder="e.g. 10/day" value={form.smokingFrequency} onChange={(event) => set('smokingFrequency')(event.target.value)} />
              </div>
            )}
          </div>

          <div className="space-y-2 rounded-md border p-3">
            <CheckboxRow
              id="ctx-anesthesia"
              label="Adverse anesthesia reaction"
              checked={form.adverseAnesthesiaReaction}
              onChange={set('adverseAnesthesiaReaction')}
            />
            {form.adverseAnesthesiaReaction && (
              <div className="space-y-1.5">
                <Label htmlFor="ctx-anesthesia-details">Details</Label>
                <Input id="ctx-anesthesia-details" placeholder="Reaction details" value={form.anesthesiaReactionDetails} onChange={(event) => set('anesthesiaReactionDetails')(event.target.value)} />
              </div>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="ctx-alcohol">Alcohol consumption</Label>
            <Input id="ctx-alcohol" placeholder="e.g. Occasional" value={form.alcoholConsumption} onChange={(event) => set('alcoholConsumption')(event.target.value)} />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSave} disabled={saving}>Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function CheckboxRow({
  id,
  label,
  checked,
  onChange,
}: {
  id: string;
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label htmlFor={id} className="flex cursor-pointer items-center gap-2 text-sm font-medium">
      <input
        id={id}
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="h-4 w-4 rounded border-border accent-primary"
      />
      {label}
    </label>
  );
}
