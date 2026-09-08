import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from '@tanstack/react-router';
import { Phone, Mail, FileText, CreditCard, Stethoscope, AlertTriangle, Pill, HeartPulse, Activity, PhoneOff, ShieldCheck, Users, Camera, Radiation, Plus, Trash2, Edit, Download, Eye } from 'lucide-react';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@danta/ui/card';
import { Button } from '@danta/ui/button';
import { Badge } from '@danta/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@danta/ui/tabs';
import { Skeleton } from '@danta/ui/skeleton';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@danta/ui/dialog';
import { Textarea } from '@danta/ui/textarea';
import { Input } from '@danta/ui/input';
import { Label } from '@danta/ui/label';
import { Select } from '@danta/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@danta/ui/table';
import { cn } from '@danta/ui/utils';
import { apiGet } from '../../lib/api/request';
import { MedicalContextDialog } from '../../components/patients/MedicalContextDialog';
import { SurgicalHistoryDialog } from '../../components/patients/SurgicalHistoryDialog';
import { PatientEditDialog } from '../../components/patients/PatientEditDialog';
import { GuardianDialog } from '../../components/patients/GuardianDialog';
import { PatientTimelinePanel } from '../../components/patients/PatientTimelinePanel';
import { CameraCaptureDialog } from '../../components/imaging/CameraCaptureDialog';
import { PatientImagingGallery } from '../../components/imaging/PatientImagingGallery';
import { RecordTreatmentsDialog } from '../../components/patients/RecordTreatmentsDialog';
import { tenantPath } from '../../lib/tenant-routing';
import { RelationshipDialog } from '../../components/patients/RelationshipDialog';
import {
  getPatientAlerts,
  updatePatient,
  getMedications,
  createMedication,
  updateMedication,
  deleteMedication,
  getClinicalNotes,
  createClinicalNote,
  updateClinicalNote,
  deleteClinicalNote,
  getTreatmentPlans,
  createTreatmentPlan,
  updateTreatmentPlan,
  deleteTreatmentPlan,
  getTreatmentHistory,
  createTreatmentHistory,
  updateTreatmentHistory,
   deleteTreatmentHistory,
     getPatientDocuments,
    uploadPatientDocument,
    deletePatientDocument,
    downloadPatientDocument,
    getDocumentTypes,
    type RelationshipView,
} from '../../lib/api/patient-clinical';
import { initiateTwainScan } from '../../lib/api/imaging';
import {
  INVERSE_RELATIONSHIP_TYPE,
  describeRelationship,
  type Invoice,
  Patient,
  Payment,
  type PatientLegalGuardian,
  type PatientRelationshipType,
  type PatientMedication,
  type ClinicalNote,
  type TreatmentPlan,
  type TreatmentHistory,
  type PatientDocument,
  type CreatePatientMedication,
  type CreateClinicalNote,
  type CreateTreatmentPlan,
  type CreateTreatmentHistory,
} from '@danta/schemas';
import { useAuth } from '../../lib/auth-context';
import { formatCurrency } from '../../lib/format';

type WorkspacePatient = Patient & {
  addresses: Array<{ id: string; line1?: string; city?: string; postcode?: string; type?: string }>;
  contacts: Array<{ id: string; name: string; relationship: string; phone: string }>;
  medicalHistory: Array<{ id: string; condition: string; status?: string; notes?: string; isControlled?: boolean; isCritical?: boolean; medications?: string }>;
  medicalContext?: {
    id: string | null;
    patientId: string;
    isPregnant: boolean;
    pregnancyWeek: number | null;
    isLactating: boolean;
    isOnAnticoagulants: boolean;
    anticoagulantMedication: string | null;
    inrValue: number | null;
    lastInrDate: string | null;
    isSmoker: boolean;
    smokingFrequency: string | null;
    alcoholConsumption: string | null;
    bruxism: boolean;
    adverseAnesthesiaReaction: boolean;
    anesthesiaReactionDetails: string | null;
  };
  guardian?: PatientLegalGuardian | null;
  relationships?: RelationshipView[];
  surgicalHistory: Array<{ id: string; procedure: string; surgeryDate?: string; complications?: string; notes?: string }>;
  allergies: Array<{ id: string; allergen: string; reaction?: string; severity: string }>;
  medications: Array<{ id: string; name: string; dosage?: string; frequency?: string; status?: string }>;
  alerts: Array<{ id: string; alertType: string; message: string; isActive: boolean; severity?: string }>;
  consents: Array<{ id: string; consentType: string; signedAt?: string | null }>;
  documents: Array<{ id: string; fileName?: string; documentName?: string; fileType?: string; uploadedAt?: string; createdAt: string }>;
  appointments: Array<{ id: string; startTime: string; endTime: string; status: string; notes?: string; appointmentType?: { name: string } | null; provider?: { firstName: string; lastName: string } | null; chair?: { name: string } | null }>;
  clinicalNotes: Array<{ id: string; note: string; type: string; signedAt?: string | null; createdAt: string }>;
  dentalCharts: Array<{ id: string; chartDate: string; conditions: Array<{ id: string; toothNumber: string; condition: string; surface?: string | null; status: string }> }>;
  treatmentHistory: Array<{ id: string; treatment: string; description?: string; cost?: string | null; date: string; status: string }>;
  treatmentPlans: Array<{ id: string; name: string; status: string; notes?: string | null; createdAt: string }>;
  periodontalRecords: Array<{ id: string; chartDate: string }>;
  imagingStudies: Array<{ id: string; studyDate: string; modality?: string; images: unknown[] }>;
  forms: Array<{ id: string; type: string; status: string; submittedAt?: string | null; createdAt: string }>;
  invoices: Array<Invoice & { invoiceNumber: string }>;
  payments: Array<Payment & { method: string }>;
};

const SEVERITY_CLASS: Record<string, string> = {
  severe: 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300',
  moderate: 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300',
  mild: 'bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300',
};

function formatDate(value?: string | Date | null): string {
  if (!value) return '—';
  return new Date(value).toLocaleDateString('en-AU', { year: 'numeric', month: 'short', day: 'numeric' });
}

export function PatientDetailPage({ patientId }: { patientId?: string } = {}) {
  const { user } = useAuth();
  const routeParams = useParams({ strict: false }) as { id?: string };
  const id = patientId ?? routeParams.id;
  const [activeTab, setActiveTab] = useState('overview');
  const [contextOpen, setContextOpen] = useState(false);
  const [surgicalOpen, setSurgicalOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [recordTreatmentsFor, setRecordTreatmentsFor] = useState<string | null>(null);
  const [guardianOpen, setGuardianOpen] = useState(false);
  const [relationshipsOpen, setRelationshipsOpen] = useState(false);
  const [cameraOpen, setCameraOpen] = useState(false);
  const [medDialogOpen, setMedDialogOpen] = useState(false);
  const [medEditId, setMedEditId] = useState<string | null>(null);
  const [noteDialogOpen, setNoteDialogOpen] = useState(false);
  const [noteEditId, setNoteEditId] = useState<string | null>(null);
  const [planDialogOpen, setPlanDialogOpen] = useState(false);
  const [planEditId, setPlanEditId] = useState<string | null>(null);
  const [historyDialogOpen, setHistoryDialogOpen] = useState(false);
  const [historyEditId, setHistoryEditId] = useState<string | null>(null);
  const [docDialogOpen, setDocDialogOpen] = useState(false);
  const [viewingDocument, setViewingDocument] = useState<PatientDocument | null>(null);

  const queryClient = useQueryClient();
  const refreshWorkspace = () => queryClient.invalidateQueries({ queryKey: ['patient-workspace', id] });

  // All hooks must run unconditionally (Rules of Hooks) — the early
  // loading/error returns below come AFTER every hook call.
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['patient-workspace', id],
    queryFn: () => apiGet<WorkspacePatient>(`/patients/${id}/workspace`),
    enabled: !!id,
  });

  // Server-computed alerts (single source of truth) with client-side
  // fallback while loading.
  const { data: alertsData } = useQuery({
    queryKey: ['patient-alerts', id],
    queryFn: () => getPatientAlerts(id as string),
    enabled: !!id,
  });

  const dncMutation = useMutation({
    mutationFn: (next: boolean) => {
      if (!id) return Promise.reject(new Error('No patient selected'));
      return updatePatient(id, { doNotContact: next });
    },
    onSuccess: async (_data, next) => {
      toast.success(next ? 'Marked as do not contact' : 'Contact enabled');
      await queryClient.invalidateQueries({ queryKey: ['patient-workspace', id] });
    },
    onError: () => toast.error('Failed to update contact preference'),
  });

  const { data: medications = [] } = useQuery({
    queryKey: ['patient-medications', id],
    queryFn: () => getMedications(id as string),
    enabled: !!id,
  });

  const { data: clinicalNotes = [] } = useQuery({
    queryKey: ['patient-clinical-notes', id],
    queryFn: () => getClinicalNotes(id as string),
    enabled: !!id,
  });

  const { data: treatmentPlans = [] } = useQuery({
    queryKey: ['patient-treatment-plans', id],
    queryFn: () => getTreatmentPlans(id as string),
    enabled: !!id,
  });

  const { data: treatmentHistory = [] } = useQuery({
    queryKey: ['patient-treatment-history', id],
    queryFn: () => getTreatmentHistory(id as string),
    enabled: !!id,
  });

  const { data: patientDocuments = [], refetch: refetchDocuments } = useQuery({
    queryKey: ['patient-documents', id],
    queryFn: () => getPatientDocuments(id as string),
    enabled: !!id,
  });

  const { data: documentTypes = [] } = useQuery({
    queryKey: ['document-types'],
    queryFn: getDocumentTypes,
  });

  const age = useMemo(() => {
    if (!data?.dateOfBirth) return null;
    const birth = new Date(data.dateOfBirth);
    const now = new Date();
    return Math.floor((now.getTime() - birth.getTime()) / (365.25 * 24 * 3600 * 1000));
  }, [data?.dateOfBirth]);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="space-y-6">
        <div className="text-center py-12">
          <p className="text-destructive mb-4">Failed to load patient details</p>
          <Button onClick={() => refetch()} variant="outline">Retry</Button>
        </div>
      </div>
    );
  }

  const patient = data;
  const outstandingBalance = (patient.invoices ?? []).reduce((sum, invoice) => sum + Number(invoice.balance), 0);
  const safeSurgicalHistory = patient.surgicalHistory ?? [];

  const fallbackAlerts = [
    ...(patient.alerts ?? []),
    ...(patient.allergies ?? []).map((allergy) => ({
      id: allergy.id,
      alertType: 'Allergy',
      message: `${allergy.allergen}${allergy.reaction ? ` — ${allergy.reaction}` : ''}`,
      severity: allergy.severity,
      isActive: true,
    })),
    ...(patient.medicalContext?.isPregnant ? [{ id: 'ctx-pregnant', alertType: 'Pregnancy', message: `Pregnant${patient.medicalContext.pregnancyWeek ? ` · Week ${patient.medicalContext.pregnancyWeek}` : ''}`, severity: 'warning', isActive: true }] : []),
    ...(patient.medicalContext?.isLactating ? [{ id: 'ctx-lactating', alertType: 'Lactation', message: 'Lactating', severity: 'info', isActive: true }] : []),
    ...(patient.medicalContext?.isOnAnticoagulants ? [{ id: 'ctx-anticoag', alertType: 'Anticoagulant', message: `On anticoagulants${patient.medicalContext.anticoagulantMedication ? ` (${patient.medicalContext.anticoagulantMedication})` : ''}`, severity: 'critical', isActive: true }] : []),
    ...(patient.medicalContext?.isSmoker ? [{ id: 'ctx-smoker', alertType: 'Smoking', message: `Smoker${patient.medicalContext.smokingFrequency ? ` · ${patient.medicalContext.smokingFrequency}` : ''}`, severity: 'warning', isActive: true }] : []),
    ...(patient.medicalContext?.adverseAnesthesiaReaction ? [{ id: 'ctx-anesthesia', alertType: 'Anesthesia', message: `Adverse anesthesia reaction${patient.medicalContext.anesthesiaReactionDetails ? `: ${patient.medicalContext.anesthesiaReactionDetails}` : ''}`, severity: 'critical', isActive: true }] : []),
    ...(patient.medicalContext?.bruxism ? [{ id: 'ctx-bruxism', alertType: 'Bruxism', message: 'Bruxism (teeth grinding)', severity: 'warning', isActive: true }] : []),
  ];
  const activeAlerts = alertsData?.alerts ?? fallbackAlerts;

  const needsGuardian = age != null && age < 18 && !patient.guardian;

  // Derive view labels at read time from raw relationship rows.
  const relationships: RelationshipView[] = (patient.relationships ?? []).map((row) => {
    const forward = row.patientId === id;
    const effectiveType = (forward ? row.type : INVERSE_RELATIONSHIP_TYPE[row.type as PatientRelationshipType]) as PatientRelationshipType;
    const other = forward ? (row as { relatedPatient?: unknown }).relatedPatient : (row as { patient?: unknown }).patient;
    return {
      ...row,
      type: row.type as PatientRelationshipType,
      inverseType: INVERSE_RELATIONSHIP_TYPE[effectiveType],
      relationshipLabel: describeRelationship(effectiveType),
      relatedPatient: (other ?? { id: '', firstName: '', lastName: '', patientNumber: '' }) as RelationshipView['relatedPatient'],
    };
  });

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      active: 'default',
      inactive: 'secondary',
      deceased: 'destructive',
    };
    return <Badge variant={variants[status] || 'outline'}>{status}</Badge>;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-semibold tracking-tight">
              {patient.firstName} {patient.lastName}
            </h1>
            {getStatusBadge(patient.status)}
          </div>
          <p className="text-muted-foreground">Patient ID: {patient.patientNumber} · DOB {formatDate(patient.dateOfBirth)}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" asChild>
            <Link to={tenantPath(user?.tenantId, `patients/${id}/clinical`)}>Clinical workspace</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link to={tenantPath(user?.tenantId, '/appointments')}>Book Appointment</Link>
          </Button>
          <Button
            variant={patient.doNotContact ? 'destructive' : 'outline'}
            onClick={() => dncMutation.mutate(!patient.doNotContact)}
            title="Toggles exclusion from recalls and outreach"
          >
            <PhoneOff className="h-4 w-4 mr-1.5" />
            Do not contact{patient.doNotContact ? ' · ON' : ''}
          </Button>
          <Button onClick={() => setEditOpen(true)}>Edit Patient</Button>
        </div>
      </div>

      {needsGuardian && (
        <div className="flex items-center justify-between rounded-md border border-amber-300 bg-amber-50 px-4 py-2 text-sm text-amber-900 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-200">
          <span>Patient is a minor ({age}) with no legal guardian on file — consent should be captured from a guardian.</span>
          <Button size="sm" variant="outline" onClick={() => setGuardianOpen(true)}>Set up guardian</Button>
        </div>
      )}

      {(activeAlerts.length > 0) && (
        <div className="flex flex-wrap gap-2" role="list" aria-label="Medical alerts">
          {activeAlerts.map((alert) => (
            <span
              key={alert.id}
              role="listitem"
              className={cn(
                'inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium',
                SEVERITY_CLASS[alert.severity?.toLowerCase() ?? ''] ?? 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300',
              )}
            >
              <AlertTriangle className="h-3.5 w-3.5" />
              {alert.message}
            </span>
          ))}
        </div>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="appointments">Appointments ({patient.appointments.length})</TabsTrigger>
          <TabsTrigger value="clinical">Clinical</TabsTrigger>
          <TabsTrigger value="timeline">Timeline</TabsTrigger>
          <TabsTrigger value="billing">Billing{outstandingBalance > 0 ? ` · ${formatCurrency(outstandingBalance)} due` : ''}</TabsTrigger>
          <TabsTrigger value="documents">Documents ({patient.documents.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Existing overview cards are preserved below via children of this section */}
          <OverviewCards patient={patient} />
        </TabsContent>

        <TabsContent value="timeline" className="space-y-4">
          <PatientTimelinePanel patientId={id ?? ''} />
        </TabsContent>


        <TabsContent value="appointments" className="space-y-4">
          <Card>
            <CardContent className="p-0">
              {recordTreatmentsFor && (
                <RecordTreatmentsDialog
                  appointmentId={recordTreatmentsFor}
                  patientId={id ?? ''}
                  open
                  onOpenChange={(open) => !open && setRecordTreatmentsFor(null)}
                />
              )}
              {patient.appointments.length === 0 ? (
                <p className="py-10 text-center text-sm text-muted-foreground">No appointments recorded.</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Procedure</TableHead>
                      <TableHead>Provider</TableHead>
                      <TableHead>Chair</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="w-40 text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {patient.appointments.map((appointment) => (
                      <TableRow key={appointment.id}>
                        <TableCell>{formatDate(appointment.startTime)} · {new Date(appointment.startTime).toLocaleTimeString('en-AU', { hour: '2-digit', minute: '2-digit' })}</TableCell>
                        <TableCell>{appointment.appointmentType?.name ?? '—'}</TableCell>
                        <TableCell>{appointment.provider ? `Dr ${appointment.provider.firstName} ${appointment.provider.lastName}` : '—'}</TableCell>
                        <TableCell>{appointment.chair?.name ?? '—'}</TableCell>
                        <TableCell><Badge variant="secondary">{appointment.status.replace(/_/g, ' ')}</Badge></TableCell>
                        <TableCell className="text-right">
                          {['in_progress', 'completed'].includes(appointment.status) && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setRecordTreatmentsFor(appointment.id)}
                            >
                              Record treatments
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="clinical" className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader className="pb-2"><CardTitle className="flex items-center gap-2 text-base"><AlertTriangle className="h-4 w-4" /> Allergies & Alerts</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              {activeAlerts.length === 0 && <p className="text-sm text-muted-foreground">None recorded.</p>}
              {activeAlerts.map((alert) => (
                <div key={alert.id} className="rounded-md border px-3 py-2 text-sm">
                  <span className={cn('mr-2 inline-block rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase', SEVERITY_CLASS[alert.severity?.toLowerCase() ?? ''] ?? 'bg-red-100 text-red-800')}>
                    {alert.alertType}
                  </span>
                  {alert.message}
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center justify-between text-base">
                <span className="flex items-center gap-2"><Pill className="h-4 w-4" /> Medications</span>
                <Button size="sm" variant="outline" onClick={() => { setMedEditId(null); setMedDialogOpen(true); }}>
                  <Plus className="h-4 w-4" /> Add
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {medications.length === 0 && <p className="text-sm text-muted-foreground">None recorded.</p>}
              {medications.map((medication) => (
                <div key={medication.id} className="rounded-md border px-3 py-2 text-sm">
                  <div className="flex justify-between">
                    <span>
                      <span className="font-medium">{medication.name}</span>
                      {medication.dosage && <span className="text-muted-foreground"> · {medication.dosage}</span>}
                      {medication.frequency && <span className="text-muted-foreground"> · {medication.frequency}</span>}
                    </span>
                    <div className="flex gap-1">
                      <Button size="sm" variant="ghost" onClick={() => { setMedEditId(medication.id); setMedDialogOpen(true); }}>
                        <Edit className="h-3 w-3" />
                      </Button>
                      <Button size="sm" variant="ghost" onClick={async () => {
                        if (!confirm('Delete this medication?')) return;
                        try {
                          await deleteMedication(id!, medication.id);
                          toast.success('Medication deleted');
                          queryClient.invalidateQueries({ queryKey: ['patient-medications', id] });
                          queryClient.invalidateQueries({ queryKey: ['patient-workspace', id] });
                        } catch {
                          toast.error('Failed to delete medication');
                        }
                      }}>
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center justify-between text-base">
                <span className="flex items-center gap-2"><Stethoscope className="h-4 w-4" /> Clinical Notes</span>
                <Button size="sm" variant="outline" onClick={() => { setNoteEditId(null); setNoteDialogOpen(true); }}>
                  <Plus className="h-4 w-4" /> Add
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {clinicalNotes.length === 0 && <p className="text-sm text-muted-foreground">No notes yet.</p>}
              {clinicalNotes.slice(0, 8).map((note) => (
                <div key={note.id} className="rounded-md border px-3 py-2">
                  <div className="mb-1 flex items-center justify-between text-xs text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">{note.type}</Badge>
                      <span>{formatDate(note.createdAt)}{note.signedAt ? ' · signed' : ''}</span>
                    </div>
                    <div className="flex gap-1">
                      <Button size="sm" variant="ghost" onClick={() => { setNoteEditId(note.id); setNoteDialogOpen(true); }}>
                        <Edit className="h-3 w-3" />
                      </Button>
                      <Button size="sm" variant="ghost" onClick={async () => {
                        if (!confirm('Delete this note?')) return;
                        try {
                          await deleteClinicalNote(note.id);
                          toast.success('Clinical note deleted');
                          queryClient.invalidateQueries({ queryKey: ['patient-clinical-notes', id] });
                          queryClient.invalidateQueries({ queryKey: ['patient-workspace', id] });
                        } catch {
                          toast.error('Failed to delete clinical note');
                        }
                      }}>
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                  <p className="line-clamp-3 text-sm">{note.note}</p>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center justify-between text-base">
                <span>Treatment Plans & History</span>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => { setPlanEditId(null); setPlanDialogOpen(true); }}>
                    <Plus className="h-4 w-4" /> Plan
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => { setHistoryEditId(null); setHistoryDialogOpen(true); }}>
                    <Plus className="h-4 w-4" /> History
                  </Button>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {treatmentPlans.map((plan) => (
                <div key={plan.id} className="rounded-md border px-3 py-2 text-sm">
                  <div className="flex justify-between">
                    <div>
                      <span className="font-medium">{plan.name}</span>
                      <Badge variant="secondary" className="ml-2">{plan.status.replace(/_/g, ' ')}</Badge>
                      <p className="mt-1 whitespace-pre-line text-xs text-muted-foreground line-clamp-4">{plan.notes}</p>
                    </div>
                    <div className="flex gap-1">
                      <Button size="sm" variant="ghost" onClick={() => { setPlanEditId(plan.id); setPlanDialogOpen(true); }}>
                        <Edit className="h-3 w-3" />
                      </Button>
                      <Button size="sm" variant="ghost" onClick={async () => {
                        if (!confirm('Delete this treatment plan?')) return;
                        try {
                          await deleteTreatmentPlan(plan.id);
                          toast.success('Treatment plan deleted');
                          queryClient.invalidateQueries({ queryKey: ['patient-treatment-plans', id] });
                          queryClient.invalidateQueries({ queryKey: ['patient-workspace', id] });
                        } catch {
                          toast.error('Failed to delete treatment plan');
                        }
                      }}>
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
              {treatmentHistory.map((history) => (
                <div key={history.id} className="rounded-md border px-3 py-2 text-sm">
                  <div className="flex justify-between">
                    <div>
                      <span className="font-medium">{history.treatment}</span>
                      <span className="float-right text-xs text-muted-foreground">{formatDate(history.date)}</span>
                      {history.cost != null && <span className="ml-2 text-xs">{formatCurrency(Number(history.cost))}</span>}
                    </div>
                    <div className="flex gap-1">
                      <Button size="sm" variant="ghost" onClick={() => { setHistoryEditId(history.id); setHistoryDialogOpen(true); }}>
                        <Edit className="h-3 w-3" />
                      </Button>
                      <Button size="sm" variant="ghost" onClick={async () => {
                        if (!confirm('Delete this treatment record?')) return;
                        try {
                          await deleteTreatmentHistory(history.id);
                          toast.success('Treatment record deleted');
                          queryClient.invalidateQueries({ queryKey: ['patient-treatment-history', id] });
                          queryClient.invalidateQueries({ queryKey: ['patient-workspace', id] });
                        } catch {
                          toast.error('Failed to delete treatment record');
                        }
                      }}>
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
              {treatmentPlans.length === 0 && treatmentHistory.length === 0 && (
                <p className="text-sm text-muted-foreground">No treatment records.</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center justify-between text-base">
                <span className="flex items-center gap-2"><HeartPulse className="h-4 w-4" /> Medical Context</span>
                <Button size="sm" variant="outline" onClick={() => setContextOpen(true)}>
                  {patient.medicalContext?.id ? 'Edit' : 'Set up'}
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {!patient.medicalContext?.id ? (
                <p className="text-sm text-muted-foreground">No clinical context recorded.</p>
              ) : (
                <div className="grid gap-2 sm:grid-cols-2">
                  {patient.medicalContext.isPregnant && (
                    <div className="rounded-md border px-3 py-2 text-sm">
                      <span className="font-medium">Pregnancy</span>
                      <span className="text-muted-foreground"> · Week {patient.medicalContext.pregnancyWeek ?? '?'}</span>
                    </div>
                  )}
                  {patient.medicalContext.isLactating && (
                    <div className="rounded-md border px-3 py-2 text-sm">
                      <span className="font-medium">Lactating</span>
                    </div>
                  )}
                  {patient.medicalContext.isOnAnticoagulants && (
                    <div className="rounded-md border px-3 py-2 text-sm">
                      <span className="font-medium">Anticoagulants</span>
                      <span className="text-muted-foreground"> · {patient.medicalContext.anticoagulantMedication ?? 'N/A'}</span>
                      {patient.medicalContext.inrValue != null && (
                        <span className="ml-2 text-xs">INR {patient.medicalContext.inrValue}{patient.medicalContext.lastInrDate ? ` (${formatDate(patient.medicalContext.lastInrDate)})` : ''}</span>
                      )}
                    </div>
                  )}
                  {patient.medicalContext.isSmoker && (
                    <div className="rounded-md border px-3 py-2 text-sm">
                      <span className="font-medium">Smoker</span>
                      <span className="text-muted-foreground"> · {patient.medicalContext.smokingFrequency ?? 'frequency N/A'}</span>
                    </div>
                  )}
                  {patient.medicalContext.alcoholConsumption && (
                    <div className="rounded-md border px-3 py-2 text-sm">
                      <span className="font-medium">Alcohol</span>
                      <span className="text-muted-foreground"> · {patient.medicalContext.alcoholConsumption}</span>
                    </div>
                  )}
                  {patient.medicalContext.bruxism && (
                    <div className="rounded-md border px-3 py-2 text-sm">
                      <span className="font-medium">Bruxism</span>
                    </div>
                  )}
                  {patient.medicalContext.adverseAnesthesiaReaction && (
                    <div className="rounded-md border px-3 py-2 text-sm sm:col-span-2">
                      <span className="font-medium">Adverse anesthesia reaction</span>
                      {patient.medicalContext.anesthesiaReactionDetails && (
                        <span className="text-muted-foreground">: {patient.medicalContext.anesthesiaReactionDetails}</span>
                      )}
                    </div>
                  )}
                  {!patient.medicalContext.isPregnant && !patient.medicalContext.isLactating && !patient.medicalContext.isOnAnticoagulants && !patient.medicalContext.isSmoker && !patient.medicalContext.alcoholConsumption && !patient.medicalContext.bruxism && !patient.medicalContext.adverseAnesthesiaReaction && (
                    <p className="text-sm text-muted-foreground sm:col-span-2">No flags set.</p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center justify-between text-base">
                <span className="flex items-center gap-2"><ShieldCheck className="h-4 w-4" /> Legal Guardian</span>
                <Button size="sm" variant="outline" onClick={() => setGuardianOpen(true)}>
                  {patient.guardian ? 'Edit' : 'Set up'}
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {patient.guardian ? (
                <div className="rounded-md border px-3 py-2 text-sm">
                  <span className="font-medium">{patient.guardian.name}</span>
                  <span className="text-muted-foreground"> · {patient.guardian.relationship}</span>
                  {patient.guardian.phone && <p className="text-xs text-muted-foreground mt-0.5">{patient.guardian.phone}</p>}
                  {patient.guardian.email && <p className="text-xs text-muted-foreground">{patient.guardian.email}</p>}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No guardian on file{(age != null && age < 18) ? ' — required for minors' : ''}.</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center justify-between text-base">
                <span className="flex items-center gap-2"><Users className="h-4 w-4" /> Relationships</span>
                <Button size="sm" variant="outline" onClick={() => setRelationshipsOpen(true)}>Manage</Button>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-1.5">
              {(patient.relationships ?? []).length === 0 && (
                <p className="text-sm text-muted-foreground">No family or guardian links recorded.</p>
              )}
              {(patient.relationships ?? []).map((row) => (
                <div key={row.id} className="rounded-md border px-3 py-1.5 text-sm">
                  <span className="font-medium">{row.relationshipLabel}</span> of{' '}
                  {row.relatedPatient.firstName} {row.relatedPatient.lastName}
                  <span className="text-xs text-muted-foreground"> ({row.relatedPatient.patientNumber})</span>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center justify-between text-base">
                <span className="flex items-center gap-2"><Activity className="h-4 w-4" /> Surgical History</span>
                <Button size="sm" variant="outline" onClick={() => setSurgicalOpen(true)}>Manage</Button>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {safeSurgicalHistory.length === 0 ? (
                <p className="py-6 text-center text-sm text-muted-foreground">No surgical history recorded.</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Procedure</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Complications</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {safeSurgicalHistory.map((entry) => (
                      <TableRow key={entry.id}>
                        <TableCell className="font-medium">{entry.procedure}</TableCell>
                        <TableCell>{formatDate(entry.surgeryDate)}</TableCell>
                        <TableCell className="text-muted-foreground">{entry.complications ?? '—'}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center justify-between text-base">
                <span className="flex items-center gap-2"><Activity className="h-4 w-4" /> Imaging and acquisition</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2 mb-4">
                <Button variant="outline" size="sm" className="gap-1.5" onClick={() => setCameraOpen(true)}>
                  <Camera className="h-4 w-4" />
                  Capture image
                </Button>
                <Button variant="outline" size="sm" className="gap-1.5" onClick={() => setCameraOpen(true)}>
                  <Radiation className="h-4 w-4" />
                  Acquisition
                </Button>
              </div>
              <PatientImagingGallery patientId={id ?? ''} patientName={patient.firstName} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="billing" className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader className="pb-2"><CardTitle className="flex items-center gap-2 text-base"><FileText className="h-4 w-4" /> Invoices</CardTitle></CardHeader>
            <CardContent className="p-0">
              {patient.invoices.length === 0 ? (
                <p className="py-8 text-center text-sm text-muted-foreground">No invoices.</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Invoice</TableHead>
                      <TableHead>Issued</TableHead>
                      <TableHead>Total</TableHead>
                      <TableHead>Balance</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {patient.invoices.map((invoice) => (
                      <TableRow key={invoice.id}>
                        <TableCell className="font-mono text-xs">{invoice.invoiceNumber}</TableCell>
                        <TableCell>{formatDate(invoice.issueDate)}</TableCell>
                        <TableCell>{formatCurrency(Number(invoice.total))}</TableCell>
                        <TableCell className={cn(Number(invoice.balance) > 0 && 'font-semibold text-red-600')}>{formatCurrency(Number(invoice.balance))}</TableCell>
                        <TableCell><Badge variant="secondary">{invoice.status.replace(/_/g, ' ')}</Badge></TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2"><CardTitle className="flex items-center gap-2 text-base"><CreditCard className="h-4 w-4" /> Payments</CardTitle></CardHeader>
            <CardContent className="p-0">
              {patient.payments.length === 0 ? (
                <p className="py-8 text-center text-sm text-muted-foreground">No payments.</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Method</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {patient.payments.map((payment) => (
                      <TableRow key={payment.id}>
                        <TableCell>{formatDate(payment.receivedAt)}</TableCell>
                        <TableCell>{String(payment.method).replace(/_/g, ' ')}</TableCell>
                        <TableCell>{formatCurrency(Number(payment.amount))}</TableCell>
                        <TableCell><Badge variant="secondary">{String(payment.status).replace(/_/g, ' ')}</Badge></TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="documents" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Documents & Forms</span>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => setDocDialogOpen(true)}>
                    <Plus className="h-4 w-4 mr-1" /> Add
                  </Button>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {(patientDocuments.length === 0 && patient.forms.length === 0) ? (
                <p className="py-10 text-center text-sm text-muted-foreground">No documents or forms on file.</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead className="w-24 text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {patientDocuments.map((doc) => (
                      <TableRow key={doc.id}>
                        <TableCell className="font-medium">{doc.name}</TableCell>
                        <TableCell>{doc.mimeType ?? '—'}</TableCell>
                        <TableCell>—</TableCell>
                        <TableCell>{formatDate(doc.createdAt)}</TableCell>
                        <TableCell className="text-right">
                          <Button size="sm" variant="ghost" onClick={() => setViewingDocument(doc)}>
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button size="sm" variant="ghost" onClick={async () => {
                            try {
                              const blob = await downloadPatientDocument(id!, doc.id);
                              const url = URL.createObjectURL(blob);
                              const a = document.createElement('a');
                              a.href = url;
                              a.download = doc.name;
                              document.body.appendChild(a);
                              a.click();
                              document.body.removeChild(a);
                              URL.revokeObjectURL(url);
                            } catch {
                              toast.error('Failed to download document');
                            }
                          }}>
                            <Download className="h-4 w-4" />
                          </Button>
                          <Button size="sm" variant="ghost" onClick={async () => {
                            if (!confirm('Delete this document?')) return;
                            try {
                              await deletePatientDocument(id!, doc.id);
                              toast.success('Document deleted');
                              refetchDocuments();
                              refreshWorkspace();
                            } catch {
                              toast.error('Failed to delete document');
                            }
                          }}>
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                    {patient.forms.map((form) => (
                      <TableRow key={form.id}>
                        <TableCell className="font-medium">{form.type} form</TableCell>
                        <TableCell>Patient form</TableCell>
                        <TableCell><Badge variant={form.status === 'submitted' ? 'default' : 'secondary'}>{form.status}</Badge></TableCell>
                        <TableCell>{formatDate(form.submittedAt ?? form.createdAt)}</TableCell>
                        <TableCell />
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {id && (
        <>
          <MedicalContextDialog
            open={contextOpen}
            onOpenChange={setContextOpen}
            patientId={id}
            context={patient.medicalContext}
            onSaved={refreshWorkspace}
          />
          <SurgicalHistoryDialog
            open={surgicalOpen}
            onOpenChange={setSurgicalOpen}
            patientId={id}
            entries={safeSurgicalHistory}
            onChanged={refreshWorkspace}
          />
          <PatientEditDialog open={editOpen} onOpenChange={setEditOpen} patient={patient} onSaved={refreshWorkspace} />
          <GuardianDialog open={guardianOpen} onOpenChange={setGuardianOpen} patientId={id} guardian={patient.guardian ?? null} onSaved={refreshWorkspace} />
          <RelationshipDialog
            open={relationshipsOpen}
            onOpenChange={setRelationshipsOpen}
            patientId={id}
            relationships={relationships}
            onChanged={refreshWorkspace}
          />
        </>
      )}

      <CameraCaptureDialog open={cameraOpen} onOpenChange={setCameraOpen} presetPatientId={id} />

      <MedicationDialog
        open={medDialogOpen}
        onOpenChange={setMedDialogOpen}
        medicationId={medEditId ?? undefined}
        medication={medEditId ? medications.find((m) => m.id === medEditId) ?? null : null}
        patientId={id}
        onSaved={() => {
          queryClient.invalidateQueries({ queryKey: ['patient-medications', id] });
          refreshWorkspace();
        }}
      />

      <ClinicalNoteDialog
        open={noteDialogOpen}
        onOpenChange={setNoteDialogOpen}
        noteId={noteEditId ?? undefined}
        note={noteEditId ? clinicalNotes.find((n) => n.id === noteEditId) ?? null : null}
        patientId={id}
        providerId={user?.id ?? ''}
        onSaved={() => {
          queryClient.invalidateQueries({ queryKey: ['patient-clinical-notes', id] });
          refreshWorkspace();
        }}
      />

      <TreatmentPlanDialog
        open={planDialogOpen}
        onOpenChange={setPlanDialogOpen}
        planId={planEditId ?? undefined}
        plan={planEditId ? treatmentPlans.find((p) => p.id === planEditId) ?? null : null}
        patientId={id}
        providerId={user?.id ?? ''}
        onSaved={() => {
          queryClient.invalidateQueries({ queryKey: ['patient-treatment-plans', id] });
          refreshWorkspace();
        }}
      />

      <TreatmentHistoryDialog
        open={historyDialogOpen}
        onOpenChange={setHistoryDialogOpen}
        historyId={historyEditId ?? undefined}
        record={historyEditId ? treatmentHistory.find((h) => h.id === historyEditId) ?? null : null}
        patientId={id}
        providerId={user?.id ?? ''}
        onSaved={() => {
          queryClient.invalidateQueries({ queryKey: ['patient-treatment-history', id] });
          refreshWorkspace();
        }}
       />

      <DocumentUploadDialog
        open={docDialogOpen}
        onOpenChange={setDocDialogOpen}
        patientId={id}
        documentTypes={documentTypes}
        onSaved={() => {
          queryClient.invalidateQueries({ queryKey: ['patient-documents', id] });
          refreshWorkspace();
        }}
      />

      <DocumentViewerDialog
        open={Boolean(viewingDocument)}
        onOpenChange={() => setViewingDocument(null)}
         doc={viewingDocument}
        patientId={id}
      />
    </div>
  );
}

function DocumentUploadDialog({
  open,
  onOpenChange,
  patientId,
  documentTypes,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  patientId: string | undefined;
  documentTypes: Array<{ id: string; name: string }>;
  onSaved: () => void;
}) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [docName, setDocName] = useState('');
  const [docType, setDocType] = useState('');
  const [customType, setCustomType] = useState('');
  const [uploading, setUploading] = useState(false);
  const [scanMode, setScanMode] = useState(false);

  useEffect(() => {
    if (open) {
      setSelectedFile(null);
      setDocName('');
      setDocType('');
      setCustomType('');
      setUploading(false);
      setScanMode(false);
    }
  }, [open]);

  const effectiveType = docType === 'custom' ? customType : docType;

  const handleUpload = async () => {
    if (!selectedFile || !patientId) return;
    if (!docName.trim()) return toast.error('Document name is required');
    if (!effectiveType.trim()) return toast.error('Select a document type');
    setUploading(true);
    try {
      await uploadPatientDocument(patientId, selectedFile, `${docName} (${effectiveType.trim()})`);
      toast.success('Document uploaded');
      onSaved();
      onOpenChange(false);
    } catch {
      toast.error('Failed to upload document');
    } finally {
      setUploading(false);
    }
  };

  const handleScan = async () => {
    if (!patientId) return;
    if (!effectiveType.trim()) return toast.error('Select a document type');
    setScanMode(true);
    try {
      const result = await initiateTwainScan({ patientId });
      toast.success(`Scan initiated. Status: ${result.status}`, {
        description: `Use the TWAIN companion app to complete the scan.`,
      });
      onSaved();
      onOpenChange(false);
    } catch {
      toast.error('Failed to initiate scan');
      setScanMode(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add document</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label>Document type</Label>
            <Select value={docType} onChange={(e) => { setDocType(e.target.value); if (e.target.value !== 'custom') setCustomType(''); }}>
              <option value="">Select type</option>
              {documentTypes.map((t) => <option key={t.id} value={t.name}>{t.name}</option>)}
              <option value="custom">Other (specify)</option>
            </Select>
          </div>
          {docType === 'custom' && (
            <div className="space-y-1.5">
              <Label>Custom type name</Label>
              <Input value={customType} onChange={(e) => setCustomType(e.target.value)} placeholder="e.g. Consent Form" />
            </div>
          )}
          <div className="space-y-1.5">
            <Label>Document name</Label>
            <Input value={docName} onChange={(e) => setDocName(e.target.value)} placeholder="Document name" />
          </div>
          {!scanMode && (
            <div className="space-y-1.5">
              <Label>File</Label>
              <input type="file" accept="image/*,.pdf,.doc,.docx,.txt" onChange={(e) => setSelectedFile(e.target.files?.[0] ?? null)} className="text-sm" />
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={uploading}>
            Cancel
          </Button>
          {uploading ? (
            <Button disabled>Uploading…</Button>
          ) : (
            <>
              {!scanMode && (
                <Button onClick={handleUpload} disabled={!selectedFile}>
                  Upload
                </Button>
              )}
              <Button onClick={handleScan} disabled={scanMode} variant="secondary">
                <Camera className="h-4 w-4 mr-2" /> Scan
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function DocumentViewerDialog({
  open,
  onOpenChange,
  doc,
  patientId,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  doc: PatientDocument | null;
  patientId: string | undefined;
}) {
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const mimeType = doc?.mimeType ?? '';
  const isPdf = mimeType.includes('pdf');
  const isImage = mimeType.includes('image');
  const canDownload = Boolean(doc && patientId);

  useEffect(() => {
    let url: string | null = null;
    if (!doc || !patientId) {
      setBlobUrl(null);
      setError(null);
      return;
    }
    setLoading(true);
    setError(null);
    downloadPatientDocument(patientId, doc.id)
      .then((blob) => {
        url = URL.createObjectURL(blob);
        setBlobUrl(url);
        setLoading(false);
      })
      .catch(() => {
        setError('Failed to load document. This may be a permission or network issue.');
        setLoading(false);
      });
    return () => { if (url) URL.revokeObjectURL(url); };
  }, [doc, patientId]);

  const viewUrl = blobUrl ?? '';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>{doc?.name ?? 'Document Viewer'}</DialogTitle>
        </DialogHeader>
        <div className="relative flex items-center justify-center bg-muted/10 rounded-md" style={{ minHeight: '300px' }}>
          {loading ? (
            <Skeleton className="h-96 w-full" />
          ) : error ? (
            <div className="p-8 text-center text-destructive">{error}</div>
          ) : !viewUrl ? (
            <div className="text-center py-8">
              <FileText className="h-12 w-12 mx-auto text-muted-foreground" />
              <p className="mt-2 text-sm text-muted-foreground">No document available for viewing.</p>
            </div>
          ) : isPdf ? (
            <iframe src={viewUrl} title={doc?.name ?? 'Document'} className="w-full h-[600px] border-0" />
          ) : isImage ? (
            <img src={viewUrl} alt={doc?.name ?? 'Document'} className="max-w-full max-h-[600px] object-contain" />
          ) : (
            <iframe src={viewUrl} title={doc?.name ?? 'Document'} className="w-full h-[600px] border-0" />
          )}
        </div>
        <DialogFooter>
          {canDownload && (
            <Button size="sm" variant="outline" onClick={async () => {
              if (!doc || !patientId) return;
              try {
                const blob = await downloadPatientDocument(patientId, doc.id);
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = doc.name;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
              } catch {
                toast.error('Failed to download document');
              }
            }}>
              <Download className="h-4 w-4 mr-2" /> Download
            </Button>
          )}
          <Button variant="outline" onClick={() => onOpenChange(false)}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function MedicationDialog({
  open,
  onOpenChange,
  medicationId,
  medication,
  patientId,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  medicationId?: string;
  medication: PatientMedication | null;
  patientId: string | undefined;
  onSaved: () => void;
}) {
  const isEdit = Boolean(medicationId);
  const [name, setName] = useState(medication?.name ?? '');
  const [dosage, setDosage] = useState(medication?.dosage ?? '');
  const [frequency, setFrequency] = useState(medication?.frequency ?? '');
  const [prescribedBy, setPrescribedBy] = useState(medication?.prescribedBy ?? '');
  const [startDate, setStartDate] = useState(medication?.startDate ? new Date(medication.startDate).toISOString().slice(0, 10) : '');
  const [endDate, setEndDate] = useState(medication?.endDate ? new Date(medication.endDate).toISOString().slice(0, 10) : '');
  const [isActive, setIsActive] = useState(medication?.isActive ?? true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open && !isEdit) {
      setName('');
      setDosage('');
      setFrequency('');
      setPrescribedBy('');
      setStartDate('');
      setEndDate('');
      setIsActive(true);
    }
  }, [open, isEdit]);

  const medMutations = useMutation<unknown, Error, { action: 'create' | 'update' | 'delete'; data?: CreatePatientMedication }>({
    mutationFn: ({ action, data }) => {
      if (!patientId) return Promise.reject(new Error('No patient'));
      if (action === 'create') return createMedication(patientId, data!);
      if (action === 'update' && medicationId) return updateMedication(patientId, medicationId, data!);
      if (action === 'delete' && medicationId) return deleteMedication(patientId, medicationId);
      return Promise.reject(new Error('Invalid'));
    },
    onSuccess: () => {
      toast.success(isEdit ? 'Medication updated' : 'Medication added');
      onSaved();
      onOpenChange(false);
    },
    onError: () => toast.error('Failed to save medication'),
  });

  const submit = async () => {
    if (!name.trim()) return toast.error('Name is required');
    setSaving(true);
    try {
      await medMutations.mutateAsync({
        action: isEdit ? 'update' : 'create',
        data: {
          name: name.trim(),
          ...(dosage ? { dosage } : {}),
          ...(frequency ? { frequency } : {}),
          ...(prescribedBy ? { prescribedBy } : {}),
          ...(startDate ? { startDate: new Date(startDate) } : {}),
          ...(endDate ? { endDate: new Date(endDate) } : {}),
          isActive,
        } as CreatePatientMedication,
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Delete this medication?')) return;
    try {
      await medMutations.mutateAsync({ action: 'delete' });
    } catch {}
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit medication' : 'Add medication'}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label>Name</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Medication name" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Dosage</Label>
              <Input value={dosage} onChange={(e) => setDosage(e.target.value)} placeholder="e.g. 500mg" />
            </div>
            <div className="space-y-1.5">
              <Label>Frequency</Label>
              <Input value={frequency} onChange={(e) => setFrequency(e.target.value)} placeholder="e.g. BID" />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Prescribed by</Label>
            <Input value={prescribedBy} onChange={(e) => setPrescribedBy(e.target.value)} placeholder="Provider name" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Start date</Label>
              <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>End date</Label>
              <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <input id="is-active" type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} />
            <Label htmlFor="is-active">Active</Label>
          </div>
        </div>
        <DialogFooter>
          {isEdit && (
            <Button variant="destructive" size="sm" onClick={handleDelete} disabled={saving}>
              <Trash2 className="h-4 w-4" /> Delete
            </Button>
          )}
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>Cancel</Button>
          <Button onClick={submit} disabled={saving}>{saving ? 'Saving…' : isEdit ? 'Update' : 'Add'}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ClinicalNoteDialog({
  open,
  onOpenChange,
  noteId,
  note,
  patientId,
  providerId,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  noteId?: string;
  note: ClinicalNote | null;
  patientId: string | undefined;
  providerId: string;
  onSaved: () => void;
}) {
  const isEdit = Boolean(noteId);
  const [type, setType] = useState(note?.type ?? 'general');
  const [noteText, setNoteText] = useState(note?.note ?? '');
  const [subjective, setSubjective] = useState(note?.subjective ?? '');
  const [objective, setObjective] = useState(note?.objective ?? '');
  const [assessment, setAssessment] = useState(note?.assessment ?? '');
  const [plan, setPlan] = useState(note?.plan ?? '');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open && !isEdit) {
      setType('general');
      setNoteText('');
      setSubjective('');
      setObjective('');
      setAssessment('');
      setPlan('');
    }
  }, [open, isEdit]);

  const noteMutations = useMutation<unknown, Error, { action: 'create' | 'update' | 'delete' }>({
    mutationFn: ({ action }) => {
      if (action === 'create') {
        return createClinicalNote({
          patientId: patientId!,
          providerId,
          note: noteText.trim(),
          ...(type ? { type } : {}),
          ...(subjective ? { subjective } : {}),
          ...(objective ? { objective } : {}),
          ...(assessment ? { assessment } : {}),
          ...(plan ? { plan } : {}),
        } as CreateClinicalNote);
      }
      if (action === 'update' && noteId) {
        return updateClinicalNote(noteId, { note: noteText, type, ...(subjective ? { subjective } : {}), ...(objective ? { objective } : {}), ...(assessment ? { assessment } : {}), ...(plan ? { plan } : {}) });
      }
      if (action === 'delete' && noteId) return deleteClinicalNote(noteId);
      return Promise.reject(new Error('Invalid'));
    },
    onSuccess: () => {
      toast.success(isEdit ? 'Note updated' : 'Note added');
      onSaved();
      onOpenChange(false);
    },
    onError: () => toast.error('Failed to save note'),
  });

  const submit = async () => {
    if (!noteText.trim()) return toast.error('Note is required');
    setSaving(true);
    try {
      await noteMutations.mutateAsync({ action: isEdit ? 'update' : 'create' });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Delete this note?')) return;
    try {
      await noteMutations.mutateAsync({ action: 'delete' });
    } catch {}
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit clinical note' : 'Add clinical note'}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label>Type</Label>
            <Select value={type} onChange={(e) => setType(e.target.value as ClinicalNote['type'])}>
              <option value="general">General</option>
              <option value="examination">Examination</option>
              <option value="procedure">Procedure</option>
              <option value="referral">Referral</option>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Note</Label>
            <Textarea value={noteText} onChange={(e) => setNoteText(e.target.value)} placeholder="Clinical note..." />
          </div>
          <div className="space-y-1.5">
            <Label>Subjective</Label>
            <Textarea value={subjective} onChange={(e) => setSubjective(e.target.value)} placeholder="Subjective..." />
          </div>
          <div className="space-y-1.5">
            <Label>Objective</Label>
            <Textarea value={objective} onChange={(e) => setObjective(e.target.value)} placeholder="Objective..." />
          </div>
          <div className="space-y-1.5">
            <Label>Assessment</Label>
            <Textarea value={assessment} onChange={(e) => setAssessment(e.target.value)} placeholder="Assessment..." />
          </div>
          <div className="space-y-1.5">
            <Label>Plan</Label>
            <Textarea value={plan} onChange={(e) => setPlan(e.target.value)} placeholder="Plan..." />
          </div>
        </div>
        <DialogFooter>
          {isEdit && (
            <Button variant="destructive" size="sm" onClick={handleDelete} disabled={saving}>
              <Trash2 className="h-4 w-4" /> Delete
            </Button>
          )}
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>Cancel</Button>
          <Button onClick={submit} disabled={saving}>{saving ? 'Saving…' : isEdit ? 'Update' : 'Add'}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function TreatmentPlanDialog({
  open,
  onOpenChange,
  planId,
  plan,
  patientId,
  providerId,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  planId?: string;
  plan: TreatmentPlan | null;
  patientId: string | undefined;
  providerId: string;
  onSaved: () => void;
}) {
  const isEdit = Boolean(planId);
  const [name, setName] = useState(plan?.name ?? '');
  const [status, setStatus] = useState(plan?.status ?? 'draft');
  const [notes, setNotes] = useState(plan?.notes ?? '');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open && !isEdit) {
      setName('');
      setStatus('draft');
      setNotes('');
    }
  }, [open, isEdit]);

  const planMutations = useMutation<unknown, Error, { action: 'create' | 'update' | 'delete' }>({
    mutationFn: ({ action }) => {
      if (action === 'create') {
        return createTreatmentPlan({
          patientId: patientId!,
          providerId,
          name: name.trim(),
          status: status as TreatmentPlan['status'],
          ...(notes.trim() ? { notes: notes.trim() } : {}),
        } as CreateTreatmentPlan);
      }
      if (action === 'update' && planId) {
        return updateTreatmentPlan(planId, {
          ...(name.trim() ? { name: name.trim() } : {}),
          ...(status ? { status: status as TreatmentPlan['status'] } : {}),
          ...(notes.trim() ? { notes: notes.trim() } : {}),
        });
      }
      if (action === 'delete' && planId) return deleteTreatmentPlan(planId);
      return Promise.reject(new Error('Invalid'));
    },
    onSuccess: () => {
      toast.success(isEdit ? 'Treatment plan updated' : 'Treatment plan added');
      onSaved();
      onOpenChange(false);
    },
    onError: () => toast.error('Failed to save treatment plan'),
  });

  const submit = async () => {
    if (!name.trim()) return toast.error('Name is required');
    setSaving(true);
    try {
      await planMutations.mutateAsync({ action: isEdit ? 'update' : 'create' });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Delete this treatment plan?')) return;
    try {
      await planMutations.mutateAsync({ action: 'delete' });
    } catch {}
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit treatment plan' : 'Add treatment plan'}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label>Name</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Plan name" />
          </div>
          <div className="space-y-1.5">
            <Label>Status</Label>
            <Select value={status} onChange={(e) => setStatus(e.target.value as TreatmentPlan['status'])}>
              <option value="draft">Draft</option>
              <option value="proposed">Proposed</option>
              <option value="approved">Approved</option>
              <option value="in_progress">In Progress</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Notes</Label>
            <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Plan notes..." />
          </div>
        </div>
        <DialogFooter>
          {isEdit && (
            <Button variant="destructive" size="sm" onClick={handleDelete} disabled={saving}>
              <Trash2 className="h-4 w-4" /> Delete
            </Button>
          )}
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>Cancel</Button>
          <Button onClick={submit} disabled={saving}>{saving ? 'Saving…' : isEdit ? 'Update' : 'Add'}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function TreatmentHistoryDialog({
  open,
  onOpenChange,
  historyId,
  record,
  patientId,
  providerId,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  historyId?: string;
  record: TreatmentHistory | null;
  patientId: string | undefined;
  providerId: string;
  onSaved: () => void;
}) {
  const isEdit = Boolean(historyId);
  const [treatment, setTreatment] = useState(record?.treatment ?? '');
  const [description, setDescription] = useState(record?.description ?? '');
  const [cost, setCost] = useState(record?.cost != null ? String(record.cost) : '');
  const [date, setDate] = useState(record?.date ? new Date(record.date).toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10));
  const [status, setStatus] = useState(record?.status ?? 'completed');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open && !isEdit) {
      setTreatment('');
      setDescription('');
      setCost('');
      setDate(new Date().toISOString().slice(0, 10));
      setStatus('completed');
    }
  }, [open, isEdit]);

  const historyMutations = useMutation<unknown, Error, { action: 'create' | 'update' | 'delete' }>({
    mutationFn: ({ action }) => {
      if (action === 'create') {
        return createTreatmentHistory({
          patientId: patientId!,
          providerId,
          treatment: treatment.trim(),
          ...(description.trim() ? { description: description.trim() } : {}),
          ...(cost.trim() ? { cost: Number(cost) } : {}),
          date: new Date(date),
          status,
        } as CreateTreatmentHistory);
      }
      if (action === 'update' && historyId) {
        return updateTreatmentHistory(historyId, {
          ...(treatment.trim() ? { treatment: treatment.trim() } : {}),
          ...(description.trim() ? { description: description.trim() } : {}),
          ...(cost.trim() ? { cost: Number(cost) } : {}),
          ...(date ? { date: new Date(date) } : {}),
          ...(status ? { status } : {}),
        });
      }
      if (action === 'delete' && historyId) return deleteTreatmentHistory(historyId);
      return Promise.reject(new Error('Invalid'));
    },
    onSuccess: () => {
      toast.success(isEdit ? 'Treatment record updated' : 'Treatment record added');
      onSaved();
      onOpenChange(false);
    },
    onError: () => toast.error('Failed to save treatment record'),
  });

  const submit = async () => {
    if (!treatment.trim()) return toast.error('Treatment is required');
    setSaving(true);
    try {
      await historyMutations.mutateAsync({ action: isEdit ? 'update' : 'create' });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Delete this treatment record?')) return;
    try {
      await historyMutations.mutateAsync({ action: 'delete' });
    } catch {}
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit treatment record' : 'Add treatment record'}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label>Treatment</Label>
            <Input value={treatment} onChange={(e) => setTreatment(e.target.value)} placeholder="Treatment name" />
          </div>
          <div className="space-y-1.5">
            <Label>Description</Label>
            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Description..." />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Cost</Label>
              <Input value={cost} onChange={(e) => setCost(e.target.value)} placeholder="0.00" type="number" step="0.01" />
            </div>
            <div className="space-y-1.5">
              <Label>Date</Label>
              <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Status</Label>
            <Select value={status} onChange={(e) => setStatus(e.target.value)}>
              <option value="completed">Completed</option>
              <option value="planned">Planned</option>
              <option value="cancelled">Cancelled</option>
            </Select>
          </div>
        </div>
        <DialogFooter>
          {isEdit && (
            <Button variant="destructive" size="sm" onClick={handleDelete} disabled={saving}>
              <Trash2 className="h-4 w-4" /> Delete
            </Button>
          )}
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>Cancel</Button>
          <Button onClick={submit} disabled={saving}>{saving ? 'Saving…' : isEdit ? 'Update' : 'Add'}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function OverviewCards({ patient }: { patient: WorkspacePatient }) {
  return (
    <div className="grid gap-4 md:grid-cols-3">
      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Contact</CardTitle></CardHeader>
        <CardContent className="space-y-1.5 text-sm">
          <p className="flex items-center gap-2"><Phone className="h-3.5 w-3.5" /> {patient.phone ?? '—'}</p>
          <p className="flex items-center gap-2 truncate"><Mail className="h-3.5 w-3.5 shrink-0" /> {patient.email ?? '—'}</p>
          {patient.addresses?.[0] && (
            <p className="text-xs text-muted-foreground">
              {[patient.addresses[0].line1, patient.addresses[0].city, patient.addresses[0].postcode].filter(Boolean).join(', ')}
            </p>
          )}
          {patient.doNotContact && <p className="text-xs font-semibold text-red-600">Do not contact is ON</p>}
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Demographics</CardTitle></CardHeader>
        <CardContent className="space-y-1.5 text-sm">
          {patient.gender && <p className="capitalize">Gender: <span className="font-medium">{patient.gender}</span></p>}
          {(patient.nationalId || patient.nationalIdType) && (
            <p>ID: <span className="font-medium">{patient.nationalId ?? '—'}</span>{patient.nationalIdType ? ` (${patient.nationalIdType.replace(/_/g, ' ')})` : ''}</p>
          )}
          {!patient.nationalId && patient.medicareNumber && <p>Medicare: <span className="font-medium">{patient.medicareNumber}</span></p>}
          {patient.profession && <p>Profession: <span className="font-medium">{patient.profession}{patient.workplace ? ` · ${patient.workplace}` : ''}</span></p>}
          {patient.preferredLanguage && <p>Language: <span className="font-medium">{patient.preferredLanguage}</span></p>}
          {!patient.gender && !patient.nationalId && !patient.nationalIdType && !patient.profession && !patient.preferredLanguage && !patient.medicareNumber && (
            <p className="text-muted-foreground">Nothing recorded.</p>
          )}
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Billing & fund</CardTitle></CardHeader>
        <CardContent className="space-y-1.5 text-sm">
          <p>Invoice name: <span className="font-medium">{patient.billingName || `${patient.firstName} ${patient.lastName}`.trim()}</span></p>
          {patient.billingTaxId && <p>Tax ID: <span className="font-medium">{patient.billingTaxId}</span></p>}
          {patient.billingEmail && <p className="truncate">Billing email: <span className="font-medium">{patient.billingEmail}</span></p>}
          {patient.healthFundName ? (
            <>
              <p>Fund: <span className="font-medium">{patient.healthFundName}</span>{patient.healthFundNumber ? ` · ${patient.healthFundNumber}` : ''}</p>
              {patient.healthFundMembershipNumber && <p className="text-xs text-muted-foreground">Membership {patient.healthFundMembershipNumber}</p>}
            </>
          ) : (
            !patient.billingTaxId && !patient.billingEmail && <p className="text-muted-foreground">No fund details.</p>
          )}
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Medical history</CardTitle></CardHeader>
        <CardContent className="text-sm space-y-1">
          {patient.medicalHistory.slice(0, 4).map((entry) => (
            <p key={entry.id} className="flex items-center gap-1.5">
              {entry.isCritical && <span aria-label="Critical condition" title="Critical" className="inline-block h-2 w-2 rounded-full bg-red-500" />}
              <span>{entry.condition}</span>
              {!entry.isControlled && <span className="text-xs text-amber-600">(uncontrolled)</span>}
              {entry.medications && <span className="text-xs text-muted-foreground">· {entry.medications}</span>}
            </p>
          ))}
          {patient.medicalHistory.length === 0 && <p className="text-muted-foreground">Nothing recorded.</p>}
        </CardContent>
      </Card>
    </div>
  );
}

