import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { ArchiveRestore, Archive, Pencil, Search, Plus, MoreHorizontal } from 'lucide-react';
import { Button } from '@danta/ui/button';
import { Input } from '@danta/ui/input';
import { Badge } from '@danta/ui/badge';
import { Skeleton } from '@danta/ui/skeleton';
import { Select } from '@danta/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@danta/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@danta/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@danta/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@danta/ui/alert-dialog';
import { Link } from '@tanstack/react-router';
import type { Patient } from '@danta/schemas';
import { toast } from 'sonner';
import { apiGet, apiPost } from '../../lib/api/request';
import { tenantPath } from '../../lib/tenant-routing';
import { useAuth } from '../../lib/auth-context';
import { archivePatient, restorePatient, updatePatient } from '../../lib/api/patient-clinical';
import { Label } from '@danta/ui/label';

const STATUS_OPTIONS = [
  { value: '', label: 'All statuses' },
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
  { value: 'deceased', label: 'Deceased' },
];

type CreatePatientForm = {
  firstName: string;
  lastName: string;
  preferredName: string;
  dateOfBirth: string;
  gender: string;
  email: string;
  phone: string;
  medicareNumber: string;
  healthFundName: string;
};

function NewPatientDialog({ open, onOpenChange, onCreated }: { open: boolean; onOpenChange: (open: boolean) => void; onCreated: () => void }) {
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<CreatePatientForm>(emptyCreateForm());

  useEffect(() => {
    if (open) setForm(emptyCreateForm());
  }, [open]);

  const set = (key: keyof CreatePatientForm) => (value: string) =>
    setForm((current) => ({ ...current, [key]: value }));

  const handleSave = async () => {
    if (!form.firstName.trim() || !form.lastName.trim()) {
      toast.error('First and last name are required');
      return;
    }
    if (!form.dateOfBirth) {
      toast.error('Date of birth is required');
      return;
    }
    if (new Date(form.dateOfBirth) > new Date()) {
      toast.error('Date of birth cannot be in the future');
      return;
    }
    if (form.email.trim() && !/^\S+@\S+\.\S+$/.test(form.email.trim())) {
      toast.error('Email address is not valid');
      return;
    }

    setSaving(true);
    try {
      await apiPost('/patients', {
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        ...(form.preferredName.trim() ? { preferredName: form.preferredName.trim() } : {}),
        dateOfBirth: form.dateOfBirth,
        ...(form.gender ? { gender: form.gender } : {}),
        ...(form.email.trim() ? { email: form.email.trim() } : {}),
        ...(form.phone.trim() ? { phone: form.phone.trim() } : {}),
        ...(form.medicareNumber.trim() ? { medicareNumber: form.medicareNumber.trim() } : {}),
        ...(form.healthFundName.trim() ? { healthFundName: form.healthFundName.trim() } : {}),
      });
      toast.success('Patient created');
      onOpenChange(false);
      onCreated();
    } catch (error) {
      toast.error(error instanceof Error && error.message ? error.message : 'Failed to create patient');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>New patient</DialogTitle>
          <DialogDescription>Only name and date of birth are required — the rest can be added later.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field id="np-first" label="First name" required value={form.firstName} onChange={set('firstName')} />
          <Field id="np-last" label="Last name" required value={form.lastName} onChange={set('lastName')} />
          <Field id="np-pref" label="Preferred name" value={form.preferredName} onChange={set('preferredName')} />
          <Field id="np-dob" label="Date of birth" type="date" required value={form.dateOfBirth} onChange={set('dateOfBirth')} />
          <div className="space-y-1.5">
            <Label htmlFor="np-gender">Gender</Label>
            <Select id="np-gender" value={form.gender} onChange={(event) => set('gender')(event.target.value)}>
              <option value="">Prefer not to say</option>
              <option value="female">Female</option>
              <option value="male">Male</option>
              <option value="other">Other</option>
            </Select>
          </div>
          <Field id="np-phone" label="Phone" type="tel" value={form.phone} onChange={set('phone')} />
          <Field id="np-email" label="Email" type="email" value={form.email} onChange={set('email')} />
          <Field id="np-medicare" label="Medicare number" value={form.medicareNumber} onChange={set('medicareNumber')} />
          <Field id="np-fund" label="Health fund" value={form.healthFundName} onChange={set('healthFundName')} />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSave} disabled={saving}>Create patient</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function emptyCreateForm(): CreatePatientForm {
  return {
    firstName: '',
    lastName: '',
    preferredName: '',
    dateOfBirth: '',
    gender: '',
    email: '',
    phone: '',
    medicareNumber: '',
    healthFundName: '',
  };
}

function Field({
  id,
  label,
  value,
  onChange,
  type = 'text',
  required,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  required?: boolean;
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}{required ? ' *' : ''}</Label>
      <Input id={id} type={type} value={value} required={required} onChange={(event) => onChange(event.target.value)} />
    </div>
  );
}

export function PatientsPage() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [createOpen, setCreateOpen] = useState(false);
  const [editingPatient, setEditingPatient] = useState<Patient | null>(null);
  const [archivingPatient, setArchivingPatient] = useState<Patient | null>(null);

  const refresh = () => queryClient.invalidateQueries({ queryKey: ['patients'] });

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['patients', search, status],
    queryFn: async () => {
      const params: Record<string, string> = {};
      if (search) params.search = search;
      if (status) params.status = status;
      return apiGet<{ data: Patient[]; total: number }>('/patients', params);
    },
  });

  const archiveMutation = useMutation({
    mutationFn: (patientId: string) => archivePatient(patientId),
    onSuccess: (_data, patientId) => {
      toast.success('Patient archived — their record is retained and restorable');
      setArchivingPatient(null);
      void refresh();
      return patientId;
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : 'Failed to archive patient'),
  });

  const restoreMutation = useMutation({
    mutationFn: (patientId: string) => restorePatient(patientId),
    onSuccess: () => {
      toast.success('Patient restored to active');
      void refresh();
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : 'Failed to restore patient'),
  });

  const patients = data?.data || [];

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      active: 'default',
      inactive: 'secondary',
      deceased: 'destructive',
    };
    return <Badge variant={variants[status] || 'outline'}>{status}</Badge>;
  };

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Patients</h1>
            <p className="text-muted-foreground">Manage patient records</p>
          </div>
        </div>
        <div className="text-center py-12">
          <p className="text-destructive mb-4">Failed to load patients</p>
          <Button onClick={() => refetch()} variant="outline">Retry</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Patients</h1>
          <p className="text-muted-foreground">Manage patient records</p>
        </div>
        <Button onClick={() => setCreateOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          New Patient
        </Button>
      </div>

      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" aria-hidden="true" />
          <Input
            placeholder="Search patients..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
            aria-label="Search patients by name, number, email or phone"
          />
        </div>
        <Select
          id="patient-status-filter"
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          aria-label="Filter by status"
          className="w-40"
        >
          {STATUS_OPTIONS.map(option => (
            <option key={option.value} value={option.value}>{option.label}</option>
          ))}
        </Select>
      </div>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>DOB</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-10"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-28" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-36" /></TableCell>
                  <TableCell><Skeleton className="h-6 w-16 rounded-full" /></TableCell>
                  <TableCell><Skeleton className="h-8 w-8" /></TableCell>
                </TableRow>
              ))
            ) : patients.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-12 text-muted-foreground">
                  No patients found{search ? ` for “${search}”` : ''}.
                </TableCell>
              </TableRow>
            ) : (
              patients.map((patient) => (
                <TableRow key={patient.id}>
                  <TableCell>
                    <Link
                      to={tenantPath(user?.tenantId, `/patients/${patient.id}`)}
                      className="text-primary hover:underline font-medium"
                    >
                      {patient.firstName} {patient.lastName}
                    </Link>
                  </TableCell>
                  <TableCell className="text-muted-foreground tabular-nums">
                    {new Date(patient.dateOfBirth).toLocaleDateString('en-AU')}
                  </TableCell>
                  <TableCell className="text-muted-foreground">{patient.phone || '-'}</TableCell>
                  <TableCell className="text-muted-foreground truncate max-w-48">{patient.email || '-'}</TableCell>
                  <TableCell>{getStatusBadge(patient.status)}</TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8" aria-label={`Actions for ${patient.firstName} ${patient.lastName}`}>
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem asChild>
                          <Link to={tenantPath(user?.tenantId, `/patients/${patient.id}`)}>View details</Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem onSelect={() => setEditingPatient(patient)}>
                          <Pencil className="h-4 w-4 mr-2" /> Edit details
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        {patient.status === 'inactive' ? (
                          <DropdownMenuItem onSelect={() => restoreMutation.mutate(patient.id)}>
                            <ArchiveRestore className="h-4 w-4 mr-2" /> Restore to active
                          </DropdownMenuItem>
                        ) : (
                          <DropdownMenuItem
                            className="text-destructive focus:text-destructive"
                            onSelect={() => setArchivingPatient(patient)}
                          >
                            <Archive className="h-4 w-4 mr-2" /> Archive
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <NewPatientDialog open={createOpen} onOpenChange={setCreateOpen} onCreated={refresh} />

      {editingPatient && (
        <EditPatientModal
          patient={editingPatient}
          onClose={() => setEditingPatient(null)}
          onSaved={() => {
            setEditingPatient(null);
            void refresh();
          }}
        />
      )}

      <AlertDialog open={!!archivingPatient} onOpenChange={(open) => !open && setArchivingPatient(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Archive {archivingPatient?.firstName} {archivingPatient?.lastName}?</AlertDialogTitle>
            <AlertDialogDescription>
              The record is kept and can be restored any time. Archived patients stop appearing in search defaults, recalls and outreach.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={(event) => {
                event.preventDefault();
                if (archivingPatient) archiveMutation.mutate(archivingPatient.id);
              }}
            >
              Archive patient
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function EditPatientModal({
  patient,
  onClose,
  onSaved,
}: {
  patient: Patient;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [saving, setSaving] = useState(false);
  const [firstName, setFirstName] = useState(patient.firstName);
  const [lastName, setLastName] = useState(patient.lastName);
  const [phone, setPhone] = useState(patient.phone ?? '');
  const [email, setEmail] = useState(patient.email ?? '');

  const handleSave = async () => {
    if (!firstName.trim() || !lastName.trim()) {
      toast.error('First and last name are required');
      return;
    }
    if (email.trim() && !/^\S+@\S+\.\S+$/.test(email.trim())) {
      toast.error('Email address is not valid');
      return;
    }
    setSaving(true);
    try {
      await updatePatient(patient.id, {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        phone: phone.trim() || undefined,
        email: email.trim() || undefined,
      });
      toast.success('Patient updated');
      onSaved();
    } catch (error) {
      toast.error(error instanceof Error && error.message ? error.message : 'Failed to update patient');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Edit patient</DialogTitle>
          <DialogDescription>Quick contact edits — full demographics live on the patient file.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field id="ep-first" label="First name" required value={firstName} onChange={setFirstName} />
          <Field id="ep-last" label="Last name" required value={lastName} onChange={setLastName} />
          <Field id="ep-phone" label="Phone" type="tel" value={phone} onChange={setPhone} />
          <Field id="ep-email" label="Email" type="email" value={email} onChange={setEmail} />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSave} disabled={saving}>Save changes</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

