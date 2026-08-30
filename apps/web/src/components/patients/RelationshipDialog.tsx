import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import { Trash2 } from 'lucide-react';
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
import { Select } from '@danta/ui/select';
import type { Patient, PatientRelationshipType } from '@danta/schemas';
import { apiGet } from '../../lib/api/request';
import { createRelationship, deleteRelationship, type RelationshipView } from '../../lib/api/patient-clinical';
import { toast } from 'sonner';

const TYPE_OPTIONS: Array<{ value: PatientRelationshipType; label: string; inverse: string }> = [
  { value: 'parent', label: 'Parent', inverse: 'this patient is their child' },
  { value: 'child', label: 'Child', inverse: 'this patient is their parent' },
  { value: 'spouse', label: 'Spouse', inverse: 'spouse' },
  { value: 'sibling', label: 'Sibling', inverse: 'sibling' },
  { value: 'guardian', label: 'Guardian of', inverse: 'this patient is their guardian' },
  { value: 'ward', label: 'Ward of', inverse: 'this patient is their ward' },
  { value: 'other', label: 'Other', inverse: 'related' },
];

interface RelationshipDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  patientId: string;
  relationships: RelationshipView[];
  onChanged: () => void;
}

export function RelationshipDialog({ open, onOpenChange, patientId, relationships, onChanged }: RelationshipDialogProps) {
  const queryClient = useQueryClient();
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');
  const [relatedId, setRelatedId] = useState('');
  const [type, setType] = useState<PatientRelationshipType>('parent');
  const [notes, setNotes] = useState('');

  const patientsQuery = useQuery({
    queryKey: ['patients', 'for-relationship', search],
    queryFn: () => apiGet<{ data: Patient[] }>('/patients', { search: search || undefined, take: 20 }),
    enabled: open,
  });

  const candidates = useMemo(
    () =>
      (patientsQuery.data?.data ?? [])
        .filter((candidate) => candidate.id !== patientId)
        .filter((candidate) => !relationships.some((row) => row.relatedPatient.id === candidate.id)),
    [patientsQuery.data, relationships, patientId],
  );

  const handleAdd = async () => {
    if (!relatedId) {
      toast.error('Select the related patient');
      return;
    }
    setSaving(true);
    try {
      await createRelationship(patientId, { relatedPatientId: relatedId, type, ...(notes.trim() ? { notes: notes.trim() } : {}) });
      toast.success('Relationship added');
      setRelatedId('');
      setNotes('');
      await queryClient.invalidateQueries({ queryKey: ['patient-workspace', patientId] });
      onChanged();
    } catch (error) {
      const message = error instanceof Error ? error.message : '';
      toast.error(/exists/i.test(message) ? 'A relationship with this patient already exists' : 'Failed to add relationship');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (relationshipId: string) => {
    try {
      await deleteRelationship(patientId, relationshipId);
      toast.success('Relationship removed');
      await queryClient.invalidateQueries({ queryKey: ['patient-workspace', patientId] });
      onChanged();
    } catch {
      toast.error('Failed to remove relationship');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Patient relationships</DialogTitle>
          <DialogDescription>Family and guardian links between patients. Labels derive automatically on both sides.</DialogDescription>
        </DialogHeader>

        <div className="space-y-3 rounded-md border p-3">
          <div className="space-y-1.5">
            <Label htmlFor="rel-search">Find patient</Label>
            <Input id="rel-search" placeholder="Search by name or number…" value={search} onChange={(event) => setSearch(event.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1.5">
              <Label htmlFor="rel-patient">Related patient</Label>
              <Select id="rel-patient" value={relatedId} onChange={(event) => setRelatedId(event.target.value)}>
                <option value="">Select…</option>
                {candidates.map((candidate) => (
                  <option key={candidate.id} value={candidate.id}>
                    {candidate.firstName} {candidate.lastName} ({candidate.patientNumber})
                  </option>
                ))}
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="rel-type">They are this patient's…</Label>
              <Select id="rel-type" value={type} onChange={(event) => setType(event.target.value as PatientRelationshipType)}>
                {TYPE_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </Select>
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            Example: choose “Parent” — on their file this patient shows as “Child”.
          </p>
          <div className="space-y-1.5">
            <Label htmlFor="rel-notes">Notes</Label>
            <Input id="rel-notes" value={notes} onChange={(event) => setNotes(event.target.value)} />
          </div>
          <Button size="sm" onClick={handleAdd} disabled={saving}>Add relationship</Button>
        </div>

        <div className="space-y-1" aria-label="Existing relationships">
          {relationships.length === 0 && <p className="py-4 text-center text-sm text-muted-foreground">No relationships recorded.</p>}
          {relationships.map((row) => (
            <div key={row.id} className="flex items-center justify-between rounded-md border px-3 py-1.5 text-xs">
              <span>
                <span className="font-medium">{row.relationshipLabel}</span> of{' '}
                {row.relatedPatient.firstName} {row.relatedPatient.lastName}
                {row.relatedPatient.patientNumber ? ` (${row.relatedPatient.patientNumber})` : ''}
                {row.notes ? ` · ${row.notes}` : ''}
              </span>
              <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => handleDelete(row.id)} aria-label="Remove relationship">
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}

export { TYPE_OPTIONS };
