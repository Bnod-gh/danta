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
import type { PatientLegalGuardian, UpsertPatientGuardian } from '@danta/schemas';
import { deleteGuardian, upsertGuardian } from '../../lib/api/patient-clinical';
import { toast } from 'sonner';

interface GuardianDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  patientId: string;
  guardian: PatientLegalGuardian | null;
  onSaved: () => void;
}

export function GuardianDialog({ open, onOpenChange, patientId, guardian, onSaved }: GuardianDialogProps) {
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: '',
    relationship: '',
    nationalId: '',
    phone: '',
    email: '',
    address: '',
    notes: '',
  });

  useEffect(() => {
    if (open) {
      setForm({
        name: guardian?.name ?? '',
        relationship: guardian?.relationship ?? '',
        nationalId: guardian?.nationalId ?? '',
        phone: guardian?.phone ?? '',
        email: guardian?.email ?? '',
        address: guardian?.address ?? '',
        notes: guardian?.notes ?? '',
      });
    }
  }, [open, guardian]);

  const set = (key: keyof typeof form) => (value: string) =>
    setForm((current) => ({ ...current, [key]: value }));

  const handleSave = async () => {
    if (!form.name.trim() || !form.relationship.trim()) {
      toast.error('Name and relationship are required');
      return;
    }
    if (form.email.trim() && !/^\S+@\S+\.\S+$/.test(form.email.trim())) {
      toast.error('Email address is not valid');
      return;
    }

    const payload: UpsertPatientGuardian = {
      name: form.name.trim(),
      relationship: form.relationship.trim(),
      ...(form.nationalId.trim() ? { nationalId: form.nationalId.trim() } : {}),
      ...(form.phone.trim() ? { phone: form.phone.trim() } : {}),
      ...(form.email.trim() ? { email: form.email.trim() } : {}),
      ...(form.address.trim() ? { address: form.address.trim() } : {}),
      ...(form.notes.trim() ? { notes: form.notes.trim() } : {}),
    };

    setSaving(true);
    try {
      await upsertGuardian(patientId, payload);
      toast.success('Legal guardian saved');
      onOpenChange(false);
      onSaved();
    } catch {
      toast.error('Failed to save legal guardian');
    } finally {
      setSaving(false);
    }
  };

  const handleRemove = async () => {
    setSaving(true);
    try {
      await deleteGuardian(patientId);
      toast.success('Guardian removed');
      onOpenChange(false);
      onSaved();
    } catch {
      toast.error('Failed to remove guardian');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Legal guardian</DialogTitle>
          <DialogDescription>For minors or incapacitated patients — consent flows target this record.</DialogDescription>
        </DialogHeader>

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="gd-name">Full name *</Label>
            <Input id="gd-name" value={form.name} onChange={(event) => set('name')(event.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="gd-rel">Relationship * </Label>
            <Input id="gd-rel" placeholder="e.g. Mother" value={form.relationship} onChange={(event) => set('relationship')(event.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="gd-phone">Phone</Label>
            <Input id="gd-phone" value={form.phone} onChange={(event) => set('phone')(event.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="gd-email">Email</Label>
            <Input id="gd-email" type="email" value={form.email} onChange={(event) => set('email')(event.target.value)} />
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="gd-nid">ID / document number</Label>
            <Input id="gd-nid" value={form.nationalId} onChange={(event) => set('nationalId')(event.target.value)} />
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="gd-address">Address</Label>
            <Input id="gd-address" value={form.address} onChange={(event) => set('address')(event.target.value)} />
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="gd-notes">Notes</Label>
            <Input id="gd-notes" value={form.notes} onChange={(event) => set('notes')(event.target.value)} />
          </div>
        </div>

        <DialogFooter>
          {guardian && (
            <Button variant="destructive" onClick={handleRemove} disabled={saving}>Remove</Button>
          )}
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSave} disabled={saving}>Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
