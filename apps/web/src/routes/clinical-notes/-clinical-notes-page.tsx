import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { Plus, Save } from 'lucide-react';
import { Button } from '@danta/ui/button';
import { Badge } from '@danta/ui/badge';
import { Textarea } from '@danta/ui/textarea';
import { Label } from '@danta/ui/label';
import { Skeleton } from '@danta/ui/skeleton';
import {
  Select,
} from '@danta/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@danta/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@danta/ui/dialog';
import { apiGet, apiPost } from '../../lib/api/request';
import { toast } from 'sonner';
import type { ClinicalNote, Patient, Provider } from '@danta/schemas';

const NOTE_TYPE_OPTIONS = [
  { value: 'general', label: 'General Note' },
  { value: 'examination', label: 'Examination' },
  { value: 'procedure', label: 'Procedure Note' },
  { value: 'referral', label: 'Referral' },
];

function getStatusBadge(status: string) {
  const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
    draft: 'secondary',
    signed: 'default',
    amended: 'outline',
  };
  return <Badge variant={variants[status] || 'outline'}>{status}</Badge>;
}

type NoteWithRelations = ClinicalNote & {
  patient: { id: string; firstName: string; lastName: string };
  provider: { id: string; firstName: string; lastName: string };
};

export function ClinicalNotesPage() {
  const [open, setOpen] = useState(false);
  const [patientId, setPatientId] = useState('');
  const [providerId, setProviderId] = useState('');
  const [content, setContent] = useState('');
  const [noteType, setNoteType] = useState('general');
  const [loading, setLoading] = useState(false);
  const queryClient = useQueryClient();

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['clinical-notes'],
    queryFn: async () => {
      const response = await apiGet<{ data: NoteWithRelations[]; total: number }>('/clinical-notes', { take: 50 });
      return response;
    },
  });

  const patientsQuery = useQuery({
    queryKey: ['patients', 'for-notes'],
    queryFn: () => apiGet<{ data: Patient[] }>('/patients', { take: 50 }),
    enabled: open,
  });

  const providersQuery = useQuery({
    queryKey: ['providers', 'for-notes'],
    queryFn: () => apiGet<Provider[]>('/providers'),
    enabled: open,
  });

  const handleCreate = async () => {
    if (!content.trim()) return;
    if (!patientId || !providerId) {
      toast.error('Select a patient and provider');
      return;
    }
    setLoading(true);
    try {
      await apiPost('/clinical-notes', { patientId, providerId, note: content, type: noteType });
      toast.success('Clinical note created');
      setOpen(false);
      setContent('');
      setPatientId('');
      setProviderId('');
      setNoteType('general');
      queryClient.invalidateQueries({ queryKey: ['clinical-notes'] });
    } catch {
      toast.error('Failed to create clinical note');
    } finally {
      setLoading(false);
    }
  };

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Clinical Notes</h1>
            <p className="text-muted-foreground">Document clinical encounters</p>
          </div>
        </div>
        <div className="text-center py-12">
          <p className="text-destructive mb-4">Failed to load clinical notes</p>
          <Button onClick={() => refetch()} variant="outline">Retry</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Clinical Notes</h1>
          <p className="text-muted-foreground">Document clinical encounters</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              New Note
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>New Clinical Note</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="note-patient">Patient</Label>
                  <Select id="note-patient" value={patientId} onChange={(event) => setPatientId(event.target.value)}>
                    <option value="">Select patient…</option>
                    {(patientsQuery.data?.data ?? []).map((patient) => (
                      <option key={patient.id} value={patient.id}>
                        {patient.firstName} {patient.lastName} ({patient.patientNumber})
                      </option>
                    ))}
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="note-provider">Provider</Label>
                  <Select id="note-provider" value={providerId} onChange={(event) => setProviderId(event.target.value)}>
                    <option value="">Select provider…</option>
                    {(providersQuery.data ?? []).map((provider) => (
                      <option key={provider.id} value={provider.id}>Dr {provider.firstName} {provider.lastName}</option>
                    ))}
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="note-type">Note type</Label>
                <Select id="note-type" value={noteType} onChange={(event) => setNoteType(event.target.value)}>
                  {NOTE_TYPE_OPTIONS.map(option => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="note-content">Content</Label>
                <Textarea
                  id="note-content"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="S: Subjective findings…&#10;O: Objective/clinical observations…&#10;A: Assessment…&#10;P: Plan…"
                  className="min-h-40"
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                <Button onClick={handleCreate} disabled={loading || !content.trim() || !patientId || !providerId}>
                  <Save className="h-4 w-4 mr-2" />
                  Save Note
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Patient</TableHead>
              <TableHead>Provider</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Content</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-28" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-64" /></TableCell>
                  <TableCell><Skeleton className="h-6 w-16 rounded-full" /></TableCell>
                </TableRow>
              ))
            ) : data?.data?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-12 text-muted-foreground">
                  No clinical notes found
                </TableCell>
              </TableRow>
            ) : (
              data?.data?.map((note) => (
                <TableRow key={note.id}>
                  <TableCell className="text-muted-foreground">
                    {new Date(note.createdAt).toLocaleDateString('en-AU')}
                  </TableCell>
                  <TableCell className="font-medium">{note.patient.firstName} {note.patient.lastName}</TableCell>
                  <TableCell>Dr {note.provider.firstName} {note.provider.lastName}</TableCell>
                  <TableCell className="capitalize">{note.type}</TableCell>
                  <TableCell className="max-w-md truncate">{note.note}</TableCell>
                  <TableCell>{getStatusBadge(note.signedAt ? 'signed' : 'draft')}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
