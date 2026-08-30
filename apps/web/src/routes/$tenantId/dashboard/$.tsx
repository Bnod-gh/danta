import { createFileRoute, useLocation, useParams } from '@tanstack/react-router';
import { DashboardIndex } from '../../dashboard/-dashboard-index.tsx';
import { PatientsPage } from '../../patients/-patients-page.tsx';
import { PatientDetailPage } from '../../patients/-patient-detail-page.tsx';
import { InvoicesPage } from '../../invoices/-invoices-page.tsx';
import { EstimatesPage } from '../../estimates/-estimates-page.tsx';
import { WaitlistPage } from '../../waitlist/-waitlist-page.tsx';
import { PatientClinicalPage } from '../../patients/-patient-clinical-page.tsx';
import { SchedulePage } from '../../schedule/-schedule-page.tsx';
import { AppointmentsPage } from '../../appointments/-appointments-page.tsx';
import { AppointmentTypesPage } from '../../appointment-types/-appointment-types-page.tsx';
import { AppointmentRemindersPage } from '../../appointment-reminders/-appointment-reminders-page.tsx';
import { RecallsPage } from '../../recalls/-recalls-page.tsx';
import { ClinicalNotesPage } from '../../clinical-notes/-clinical-notes-page.tsx';
import { DentalChartsPage } from '../../dental-charts/-dental-charts-page.tsx';
import { TreatmentPlansPage } from '../../treatment-plans/-treatment-plans-page.tsx';
import { PeriodontalRecordsPage } from '../../periodontal-records/-periodontal-records-page.tsx';
import { TemplatesPage } from '../../templates/-templates-page.tsx';
import { ImagingStudiesPage } from '../../imaging-studies/-imaging-studies-page.tsx';
import { ImagingImagesPage } from '../../imaging-images/-imaging-images-page.tsx';
import { PaymentsPage } from '../../payments/-payments-page.tsx';
import { RefundsPage } from '../../refunds/-refunds-page.tsx';
import { StatementsPage } from '../../statements/-statements-page.tsx';
import { ReceiptsPage } from '../../receipts/-receipts-page.tsx';
import { FeesPage } from '../../fees/-fees-page.tsx';
import { MessagesPage } from '../../messages/-messages-page.tsx';
import { CommunicationTemplatesPage } from '../../communication-templates/-communication-templates-page.tsx';
import { CommunicationPreferencesPage } from '../../communication-preferences/-communication-preferences-page.tsx';
import { ClaimIntegrationsPage } from '../../claim-integrations/-claim-integrations-page.tsx';
import { ImagingIntegrationsPage } from '../../imaging-integrations/-imaging-integrations-page.tsx';
import { NotificationsPage } from '../../notifications/-notifications-page.tsx';
import { TreatmentHistoryPage } from '../../treatment-history/-treatment-history-page.tsx';
import { ToothConditionsPage } from '../../tooth-conditions/-tooth-conditions-page.tsx';
import { ServicesPage } from '../../services/-services-page.tsx';
import { RolesPage } from '../../roles/-roles-page.tsx';
import { ReportsPage } from '../../reports/-reports-page.tsx';
import { RevenuePage } from '../../reports/revenue/-revenue-page.tsx';
import { ProductionPage } from '../../reports/production/-production-page.tsx';
import { CollectionsPage } from '../../reports/collections/-collections-page.tsx';
import { AppointmentsPage as ReportAppointmentsPage } from '../../reports/appointments/-appointments-page.tsx';
import { RecallsPage as ReportRecallsPage } from '../../reports/recalls/-recalls-page.tsx';
import { PatientsPage as ReportPatientsPage } from '../../reports/patients/-patients-page.tsx';
import { PractitionersPage } from '../../reports/practitioners/-practitioners-page.tsx';
import { SettingsPage } from '../../settings/-settings-page.tsx';
import { LocationSettingsPage } from '../../settings/locations/-location-settings-page.tsx';
import { OrganisationSettingsPage } from '../../settings/organisation/-organisation-settings-page.tsx';
import { PracticeSettingsPage } from '../../settings/practice/-practice-settings-page.tsx';
import { SecuritySettingsPage } from '../../settings/security/-security-settings-page.tsx';
import { LocationsPage } from '../../locations/-locations-page.tsx';
import { ProvidersPage } from '../../providers/-providers-page.tsx';
import { ChairsPage } from '../../chairs/-chairs-page.tsx';
import { UsersPage } from '../../users/-users-page.tsx';
import { AuditPage } from '../../audit/-audit-page.tsx';
import { ApiKeysPage } from '../../api-keys/-api-keys-page.tsx';

const pages: Record<string, React.ComponentType> = {
  schedule: SchedulePage,
  appointments: AppointmentsPage,
  'appointment-types': AppointmentTypesPage,
  'appointment-reminders': AppointmentRemindersPage,
  recalls: RecallsPage,
  'clinical-notes': ClinicalNotesPage,
  'dental-charts': DentalChartsPage,
  'treatment-plans': TreatmentPlansPage,
  'periodontal-records': PeriodontalRecordsPage,
  templates: TemplatesPage,
  'imaging-studies': ImagingStudiesPage,
  'imaging-images': ImagingImagesPage,
  invoices: InvoicesPage,
  estimates: EstimatesPage,
  waitlist: WaitlistPage,
  payments: PaymentsPage,
  refunds: RefundsPage,
  statements: StatementsPage,
  receipts: ReceiptsPage,
  fees: FeesPage,
  messages: MessagesPage,
  'communication-templates': CommunicationTemplatesPage,
  'communication-preferences': CommunicationPreferencesPage,
  'claim-integrations': ClaimIntegrationsPage,
  'imaging-integrations': ImagingIntegrationsPage,
  notifications: NotificationsPage,
  'treatment-history': TreatmentHistoryPage,
  'tooth-conditions': ToothConditionsPage,
  services: ServicesPage,
  roles: RolesPage,
  reports: ReportsPage,
  'reports/revenue': RevenuePage,
  'reports/production': ProductionPage,
  'reports/collections': CollectionsPage,
  'reports/appointments': ReportAppointmentsPage,
  'reports/recalls': ReportRecallsPage,
  'reports/patients': ReportPatientsPage,
  'reports/practitioners': PractitionersPage,
  settings: TenantSettingsProxy,
  'settings/general': TenantSettingsProxy,
  'settings/workspace': TenantSettingsProxy,
  'settings/people': TenantSettingsProxy,
  'settings/clinical': TenantSettingsProxy,
  'settings/billing': TenantSettingsProxy,
  'settings/billing-tax': TenantSettingsProxy,
  'settings/communication': TenantSettingsProxy,
  'settings/integrations': TenantSettingsProxy,
  'settings/modules': TenantSettingsProxy,
  'settings/account': TenantSettingsProxy,
  'settings/locations': LocationSettingsPage,
  'settings/organisation': OrganisationSettingsPage,
  'settings/practice': PracticeSettingsPage,
  'settings/security': SecuritySettingsPage,
  locations: LocationsPage,
  providers: ProvidersPage,
  chairs: ChairsPage,
  users: UsersPage,
  audit: AuditPage,
  'api-keys': ApiKeysPage,
};

function TenantDashboardCatchall() {
  const { _splat } = useParams({ strict: false }) as { _splat?: string };
  const path = (_splat ?? '').replace(/^\/+|\/+$/g, '');
  const segments = path.split('/').filter(Boolean);

  if (!path) return <DashboardIndex />;
  if (segments[0] === 'patients') {
    if (segments[1] && segments[2] === 'invoices') return <InvoicesPage patientId={segments[1]} />;
    if (segments[1] && segments[2] === 'clinical') return <PatientClinicalPage patientId={segments[1]} />;
    if (segments[1]) return <PatientDetailPage patientId={segments[1]} />;
    return <PatientsPage />;
  }

  const Page = pages[path];
  return Page ? <Page /> : <DashboardIndex />;
}

function TenantSettingsProxy() {
  const location = useLocation();
  const section = location.pathname.split('/settings/')[1]?.split('/')[0];
  return <SettingsPage section={section} />;
}

export const Route = createFileRoute('/$tenantId/dashboard/$')({
  component: TenantDashboardCatchall,
});



