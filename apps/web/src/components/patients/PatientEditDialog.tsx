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
import { Select } from '@danta/ui/select';
import type { Patient } from '@danta/schemas';
import { updatePatient } from '../../lib/api/patient-clinical';
import { toast } from 'sonner';

interface PatientEditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  patient: Patient;
  onSaved: () => void;
}

type FormState = {
  firstName: string;
  lastName: string;
  preferredName: string;
  phone: string;
  email: string;
  gender: string;
  medicareNumber: string;
  healthFundName: string;
  healthFundNumber: string;
  healthFundMembershipNumber: string;
  nationalId: string;
  nationalIdType: string;
  profession: string;
  workplace: string;
  preferredLanguage: string;
  notes: string;
  billingName: string;
  billingTaxId: string;
  billingEmail: string;
  doNotContact: boolean;
};

export function PatientEditDialog({ open, onOpenChange, patient, onSaved }: PatientEditDialogProps) {
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<FormState>(emptyForm(patient));

  useEffect(() => {
    if (open) setForm(emptyForm(patient));
  }, [open]);

  const set = (key: keyof FormState) => (value: string | boolean) =>
    setForm((current) => ({ ...current, [key]: value }));

  const handleSave = async () => {
    if (!form.firstName.trim() || !form.lastName.trim()) {
      toast.error('First and last name are required');
      return;
    }
    if (form.email.trim() && !/^\S+@\S+\.\S+$/.test(form.email.trim())) {
      toast.error('Email address is not valid');
      return;
    }
    if (form.billingEmail.trim() && !/^\S+@\S+\.\S+$/.test(form.billingEmail.trim())) {
      toast.error('Billing email is not valid');
      return;
    }

    const payload: Record<string, unknown> = {};
    (Object.keys(form) as Array<keyof FormState>).forEach((key) => {
      const value = form[key];
      payload[key] = typeof value === 'string' ? (value.trim() || undefined) : value;
    });

    setSaving(true);
    try {
      await updatePatient(patient.id, payload);
      toast.success('Patient details saved');
      onOpenChange(false);
      onSaved();
    } catch {
      toast.error('Failed to save patient details');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit patient</DialogTitle>
          <DialogDescription>Identity, contact, demographics and billing details.</DialogDescription>
        </DialogHeader>

        <section className="grid gap-3 sm:grid-cols-2" aria-label="Identity">
          <Field label="First name" id="pe-first" required value={form.firstName} onChange={set('firstName')} />
          <Field label="Last name" id="pe-last" required value={form.lastName} onChange={set('lastName')} />
          <Field label="Preferred name" id="pe-pref" value={form.preferredName} onChange={set('preferredName')} />
          <div className="space-y-1.5">
            <Label htmlFor="pe-gender">Gender</Label>
            <Select id="pe-gender" value={form.gender} onChange={(event) => set('gender')(event.target.value)}>
              <option value="">Prefer not to say</option>
              <option value="female">Female</option>
              <option value="male">Male</option>
              <option value="other">Other</option>
            </Select>
          </div>
          <Field label="Phone" id="pe-phone" value={form.phone} onChange={set('phone')} />
          <Field label="Email" id="pe-email" type="email" value={form.email} onChange={set('email')} />
        </section>

        <section className="grid gap-3 sm:grid-cols-2" aria-label="Demographics">
          <Field label="Medicare number" id="pe-medicare" value={form.medicareNumber} onChange={set('medicareNumber')} />
          <div className="space-y-1.5">
            <Label htmlFor="pe-id-type">ID type</Label>
            <Select id="pe-id-type" value={form.nationalIdType} onChange={(event) => set('nationalIdType')(event.target.value)}>
              <option value="">None</option>
              <option value="medicare">Medicare card</option>
              <option value="passport">Passport</option>
              <option value="drivers_licence">Driver's licence</option>
              <option value="other">Other</option>
            </Select>
          </div>
          <Field label="ID / document number" id="pe-nid" value={form.nationalId} onChange={set('nationalId')} />
          <Field label="Preferred language" id="pe-lang" placeholder="en-AU" value={form.preferredLanguage} onChange={set('preferredLanguage')} />
          <Field label="Profession" id="pe-prof" value={form.profession} onChange={set('profession')} />
          <Field label="Workplace" id="pe-work" value={form.workplace} onChange={set('workplace')} />
        </section>

        <section className="grid gap-3 sm:grid-cols-2" aria-label="Health fund">
          <Field label="Health fund" id="pe-fund" value={form.healthFundName} onChange={set('healthFundName')} />
          <Field label="Fund number" id="pe-fundnum" value={form.healthFundNumber} onChange={set('healthFundNumber')} />
          <Field label="Membership number" id="pe-memb" value={form.healthFundMembershipNumber} onChange={set('healthFundMembershipNumber')} />
        </section>

        <section className="grid gap-3 sm:grid-cols-2" aria-label="Billing">
          <Field label="Billing name override" id="pe-bname" placeholder="Defaults to patient name" value={form.billingName} onChange={set('billingName')} />
          <Field label="Billing tax ID" id="pe-btax" value={form.billingTaxId} onChange={set('billingTaxId')} />
          <Field label="Billing email" id="pe-bemail" type="email" value={form.billingEmail} onChange={set('billingEmail')} />
        </section>

        <section className="space-y-1.5" aria-label="Notes">
          <Label htmlFor="pe-notes">Notes</Label>
          <textarea
            id="pe-notes"
            className="flex min-h-20 w-full rounded-md border border-border bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            value={form.notes}
            onChange={(event) => set('notes')(event.target.value)}
          />
        </section>

        <label htmlFor="pe-dnc" className="flex cursor-pointer items-center gap-2 text-sm font-medium">
          <input
            id="pe-dnc"
            type="checkbox"
            checked={form.doNotContact}
            onChange={(event) => set('doNotContact')(event.target.checked)}
            className="h-4 w-4 rounded border-border accent-primary"
          />
          Do not contact — excludes this patient from recalls and outreach
        </label>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSave} disabled={saving}>Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function emptyForm(patient: Patient): FormState {
  return {
    firstName: patient.firstName ?? '',
    lastName: patient.lastName ?? '',
    preferredName: patient.preferredName ?? '',
    phone: patient.phone ?? '',
    email: patient.email ?? '',
    gender: patient.gender ?? '',
    medicareNumber: patient.medicareNumber ?? '',
    healthFundName: patient.healthFundName ?? '',
    healthFundNumber: patient.healthFundNumber ?? '',
    healthFundMembershipNumber: patient.healthFundMembershipNumber ?? '',
    nationalId: patient.nationalId ?? '',
    nationalIdType: patient.nationalIdType ?? '',
    profession: patient.profession ?? '',
    workplace: patient.workplace ?? '',
    preferredLanguage: patient.preferredLanguage ?? '',
    notes: patient.notes ?? '',
    billingName: patient.billingName ?? '',
    billingTaxId: patient.billingTaxId ?? '',
    billingEmail: patient.billingEmail ?? '',
    doNotContact: Boolean(patient.doNotContact),
  };
}

function Field({
  label,
  id,
  value,
  onChange,
  type = 'text',
  required,
  placeholder,
}: {
  label: string;
  id: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  required?: boolean;
  placeholder?: string;
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}{required ? ' *' : ''}</Label>
      <Input id={id} type={type} value={value} placeholder={placeholder} onChange={(event) => onChange(event.target.value)} />
    </div>
  );
}
