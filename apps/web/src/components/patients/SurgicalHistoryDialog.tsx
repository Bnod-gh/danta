import { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { Button } from '@danta/ui/button';
import { Input } from '@danta/ui/input';
import { Label } from '@danta/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@danta/ui/dialog';
import type { PatientSurgicalHistory } from '@danta/schemas';
import { createSurgicalHistory, deleteSurgicalHistory } from '../../lib/api/patient-clinical';
import { toast } from 'sonner';

interface SurgicalHistoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  patientId: string;
  entries: PatientSurgicalHistory[] | Array<{ id: string; procedure: string; surgeryDate?: string; complications?: string; notes?: string }>;
  onChanged: () => void;
}

export function SurgicalHistoryDialog({ open, onOpenChange, patientId, entries, onChanged }: SurgicalHistoryDialogProps) {
  const [saving, setSaving] = useState(false);
  const [procedure, setProcedure] = useState('');
  const [surgeryDate, setSurgeryDate] = useState('');
  const [complications, setComplications] = useState('');
  const [notes, setNotes] = useState('');

  const handleAdd = async () => {
    if (!procedure.trim()) {
      toast.error('Procedure is required');
      return;
    }
    setSaving(true);
    try {
      await createSurgicalHistory(patientId, {
        procedure: procedure.trim(),
        ...(surgeryDate ? { surgeryDate: new Date(`${surgeryDate}T00:00:00`) } : {}),
        ...(complications.trim() ? { complications: complications.trim() } : {}),
        ...(notes.trim() ? { notes: notes.trim() } : {}),
      });
      toast.success('Surgery record added');
      setProcedure('');
      setSurgeryDate('');
      setComplications('');
      setNotes('');
      onChanged();
    } catch {
      toast.error('Failed to add surgery record');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteSurgicalHistory(patientId, id);
      toast.success('Record removed');
      onChanged();
    } catch {
      toast.error('Failed to remove record');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Surgical history</DialogTitle>
          <DialogDescription>Prior operations relevant to treatment planning and risk assessment.</DialogDescription>
        </DialogHeader>

        <div className="space-y-2 rounded-md border p-3">
          <div className="space-y-1.5">
            <Label htmlFor="sx-procedure">Procedure</Label>
            <Input id="sx-procedure" placeholder="e.g. Appendectomy" value={procedure} onChange={(event) => setProcedure(event.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1.5">
              <Label htmlFor="sx-date">Date</Label>
              <Input id="sx-date" type="date" value={surgeryDate} onChange={(event) => setSurgeryDate(event.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="sx-complications">Complications</Label>
              <Input id="sx-complications" placeholder="None" value={complications} onChange={(event) => setComplications(event.target.value)} />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="sx-notes">Notes</Label>
            <Input id="sx-notes" value={notes} onChange={(event) => setNotes(event.target.value)} />
          </div>
          <Button size="sm" onClick={handleAdd} disabled={saving}>
            <Plus className="h-3.5 w-3.5 mr-1" /> Add record
          </Button>
        </div>

        <div className="space-y-1" aria-label="Existing surgical records">
          {entries.length === 0 && <p className="py-4 text-center text-sm text-muted-foreground">No records yet.</p>}
          {entries.map((entry) => (
            <div key={entry.id} className="flex items-center justify-between rounded-md border px-3 py-1.5 text-xs">
              <span>
                <span className="font-medium">{entry.procedure}</span>
                {entry.surgeryDate ? ` · ${new Date(entry.surgeryDate).toLocaleDateString('en-AU')}` : ''}
                {entry.complications ? ` · ${entry.complications}` : ''}
              </span>
              <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => handleDelete(entry.id)} aria-label={`Remove ${entry.procedure}`}>
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
