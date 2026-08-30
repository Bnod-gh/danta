import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import { Link, useParams } from '@tanstack/react-router';
import { Phone, Mail, FileText, CreditCard, Stethoscope, AlertTriangle, Pill, HeartPulse, Activity, PhoneOff, ShieldCheck, Users, Camera } from 'lucide-react';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@danta/ui/card';
import { Button } from '@danta/ui/button';
import { Badge } from '@danta/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@danta/ui/tabs';
import { Skeleton } from '@danta/ui/skeleton';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@danta/ui/dialog';
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
import { downloadImageOriginal } from '../../lib/api/imaging';
import { RecordTreatmentsDialog } from '../../components/patients/RecordTreatmentsDialog';
import { tenantPath } from '../../lib/tenant-routing';
import { RelationshipDialog } from '../../components/patients/RelationshipDialog';
import {
  getPatientAlerts,
  updatePatient,
  type RelationshipView,
} from '../../lib/api/patient-clinical';
import {
  INVERSE_RELATIONSHIP_TYPE,
  describeRelationship,
  type Invoice,
  Patient,
  Payment,
  type PatientLegalGuardian,
  type PatientRelationshipType,
} from '@danta/schemas';
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
  const [viewerImageId, setViewerImageId] = useState<string | null>(null);
  const [viewerImageUrl, setViewerImageUrl] = useState<string | null>(null);

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

  const openImageViewer = async (image: { id: string; fileName: string; url?: string; storageKey?: string; mimeType?: string; toothNumber?: string }) => {
    try {
      const blob = await downloadImageOriginal(image.id);
      const url = URL.createObjectURL(blob);
      setViewerImageUrl(url);
      setViewerImageId(image.id);
    } catch {
      setViewerImageUrl(image.url || `/storage/${image.storageKey}`);
      setViewerImageId(image.id);
    }
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
            <Link to={tenantPath(id ?? '', `patients/${id}/clinical`)}>Clinical workspace</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link to="/appointments">Book Appointment</Link>
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
            <CardHeader className="pb-2"><CardTitle className="flex items-center gap-2 text-base"><Pill className="h-4 w-4" /> Medications</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              {patient.medications.length === 0 && <p className="text-sm text-muted-foreground">None recorded.</p>}
              {patient.medications.map((medication) => (
                <div key={medication.id} className="rounded-md border px-3 py-2 text-sm">
                  <span className="font-medium">{medication.name}</span>
                  {medication.dosage && <span className="text-muted-foreground"> · {medication.dosage}</span>}
                  {medication.frequency && <span className="text-muted-foreground"> · {medication.frequency}</span>}
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2"><CardTitle className="flex items-center gap-2 text-base"><Stethoscope className="h-4 w-4" /> Clinical Notes</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              {patient.clinicalNotes.length === 0 && <p className="text-sm text-muted-foreground">No notes yet.</p>}
              {patient.clinicalNotes.slice(0, 8).map((note) => (
                <div key={note.id} className="rounded-md border px-3 py-2">
                  <div className="mb-1 flex items-center justify-between text-xs text-muted-foreground">
                    <Badge variant="outline">{note.type}</Badge>
                    <span>{formatDate(note.createdAt)}{note.signedAt ? ' · signed' : ''}</span>
                  </div>
                  <p className="line-clamp-3 text-sm">{note.note}</p>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-base">Treatment Plans & History</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              {patient.treatmentPlans.map((plan) => (
                <div key={plan.id} className="rounded-md border px-3 py-2 text-sm">
                  <span className="font-medium">{plan.name}</span>
                  <Badge variant="secondary" className="ml-2">{plan.status.replace(/_/g, ' ')}</Badge>
                  <p className="mt-1 whitespace-pre-line text-xs text-muted-foreground line-clamp-4">{plan.notes}</p>
                </div>
              ))}
              {patient.treatmentHistory.slice(0, 5).map((history) => (
                <div key={history.id} className="rounded-md border px-3 py-2 text-sm">
                  <span className="font-medium">{history.treatment}</span>
                  <span className="float-right text-xs text-muted-foreground">{formatDate(history.date)}</span>
                  {history.cost != null && <span className="ml-2 text-xs">{formatCurrency(Number(history.cost))}</span>}
                </div>
              ))}
              {patient.treatmentPlans.length === 0 && patient.treatmentHistory.length === 0 && (
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
              {patient.imagingStudies && patient.imagingStudies.length > 0 ? (
                <div className="space-y-4">
                  {patient.imagingStudies.slice(0, 6).map((study) => (
                    <div key={study.id} className="rounded-md border px-3 py-2">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium">{study.modality?.replace(/_/g, ' ') ?? 'Unknown'}</span>
                        <span className="text-xs text-muted-foreground">{formatDate(study.studyDate)}</span>
                      </div>
                      <div className="grid grid-cols-4 gap-2">
                        {(study.images ?? []).slice(0, 8).map((image: any) => (
                          <button
                            key={image.id}
                            type="button"
                            onClick={() => openImageViewer(image)}
                            className="relative aspect-square rounded border bg-muted hover:opacity-85 transition-opacity"
                          >
                             <img
                              src={`/storage/${image.storageKey}`}
                              alt={image.fileName}
                              className="h-full w-full object-cover rounded"
                              onError={(e) => { (e.target as HTMLImageElement).src = '/placeholder-image.png'; }}
                            />
                            {image.toothNumber && (
                              <Badge variant="secondary" className="absolute top-0.5 right-0.5 h-4 w-4 min-w-[1rem] text-[9px] font-mono">{image.toothNumber}</Badge>
                            )}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No imaging studies recorded.</p>
              )}
              <Button variant="outline" size="sm" className="mt-3 gap-1.5" onClick={() => setCameraOpen(true)}>
                <Camera className="h-4 w-4" />
                Capture image
              </Button>
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
            <CardContent className="p-0">
              {patient.documents.length === 0 && patient.forms.length === 0 ? (
                <p className="py-10 text-center text-sm text-muted-foreground">No documents or forms on file.</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {patient.documents.map((document) => (
                      <TableRow key={document.id}>
                        <TableCell className="font-medium">{document.documentName ?? document.fileName ?? 'Document'}</TableCell>
                        <TableCell>{document.fileType ?? '—'}</TableCell>
                        <TableCell>—</TableCell>
                        <TableCell>{formatDate(document.uploadedAt ?? document.createdAt)}</TableCell>
                      </TableRow>
                    ))}
                    {patient.forms.map((form) => (
                      <TableRow key={form.id}>
                        <TableCell className="font-medium">{form.type} form</TableCell>
                        <TableCell>Patient form</TableCell>
                        <TableCell><Badge variant={form.status === 'submitted' ? 'default' : 'secondary'}>{form.status}</Badge></TableCell>
                        <TableCell>{formatDate(form.submittedAt ?? form.createdAt)}</TableCell>
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

      <Dialog open={!!viewerImageId} onOpenChange={(open) => { if (!open) { setViewerImageId(null); setViewerImageUrl(null); } }}>
        <DialogContent className="max-w-4xl p-0">
          <DialogHeader className="p-4 pb-0">
            <DialogTitle>Imaging viewer</DialogTitle>
          </DialogHeader>
          {viewerImageUrl && (
            <img
              src={viewerImageUrl}
              alt="Imaging"
              className="h-[70vh] w-full object-contain bg-black"
              onError={(e) => {(e.target as HTMLImageElement).src = '/placeholder-image.png';}}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
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

