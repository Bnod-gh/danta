import { Route } from '@tanstack/react-router';
import { rootRoute } from './routes/__root';
import { DashboardIndex } from './routes/dashboard';
import { LoginPage } from './routes/login';
import { RegisterPage } from './routes/register';
// @ts-expect-error TanStack Router v1 type inference requires routeTree generation
import { PatientsPage } from './routes/patients';
// @ts-expect-error TanStack Router v1 type inference requires routeTree generation
import { PatientDetailPage } from './routes/patients/$id';
// @ts-expect-error TanStack Router v1 type inference requires routeTree generation
import { AppointmentTypesPage } from './routes/appointment-types';
// @ts-expect-error TanStack Router v1 type inference requires routeTree generation
import { ProvidersPage } from './routes/providers';
// @ts-expect-error TanStack Router v1 type inference requires routeTree generation
import { ChairsPage } from './routes/chairs';
// @ts-expect-error TanStack Router v1 type inference requires routeTree generation
import { AvailabilityPage } from './routes/availability';
// @ts-expect-error TanStack Router v1 type inference requires routeTree generation
import { AppointmentsPage } from './routes/appointments';
// @ts-expect-error TanStack Router v1 type inference requires routeTree generation
import { ClinicalNotesPage } from './routes/clinical-notes';
// @ts-expect-error TanStack Router v1 type inference requires routeTree generation
import { TemplatesPage } from './routes/templates';
// @ts-expect-error TanStack Router v1 type inference requires routeTree generation
import { DentalChartsPage } from './routes/dental-charts';
// @ts-expect-error TanStack Router v1 type inference requires routeTree generation
import { ToothConditionsPage } from './routes/tooth-conditions';
// @ts-expect-error TanStack Router v1 type inference requires routeTree generation
import { TreatmentHistoryPage } from './routes/treatment-history';
// @ts-expect-error TanStack Router v1 type inference requires routeTree generation
import { TreatmentPlansPage } from './routes/treatment-plans';
// @ts-expect-error TanStack Router v1 type inference requires routeTree generation
import { PeriodontalRecordsPage } from './routes/periodontal-records';
// @ts-expect-error TanStack Router v1 type inference requires routeTree generation
import { ImagingStudiesPage } from './routes/imaging-studies';
// @ts-expect-error TanStack Router v1 type inference requires routeTree generation
import { ImagingImagesPage } from './routes/imaging-images';
// @ts-expect-error TanStack Router v1 type inference requires routeTree generation
import { ImagingIntegrationsPage } from './routes/imaging-integrations';
// @ts-expect-error TanStack Router v1 type inference requires routeTree generation
import { InvoicesPage } from './routes/invoices';
// @ts-expect-error TanStack Router v1 type inference requires routeTree generation
import { ClaimIntegrationsPage } from './routes/claim-integrations';
// @ts-expect-error TanStack Router v1 type inference requires routeTree generation
import { StatementsPage } from './routes/statements';
// @ts-expect-error TanStack Router v1 type inference requires routeTree generation
import { CommunicationPreferencesPage } from './routes/communication-preferences';
// @ts-expect-error TanStack Router v1 type inference requires routeTree generation
import { CommunicationTemplatesPage } from './routes/communication-templates';
// @ts-expect-error TanStack Router v1 type inference requires routeTree generation
import { AppointmentRemindersPage } from './routes/appointment-reminders';
// @ts-expect-error TanStack Router v1 type inference requires routeTree generation
import { ServicesPage } from './routes/services';
// @ts-expect-error TanStack Router v1 type inference requires routeTree generation
import { FeesPage } from './routes/fees';
// @ts-expect-error TanStack Router v1 type inference requires routeTree generation
import { MessagesPage } from './routes/messages';
// @ts-expect-error TanStack Router v1 type inference requires routeTree generation
import { PaymentsPage } from './routes/payments';
// @ts-expect-error TanStack Router v1 type inference requires routeTree generation
import { ReceiptsPage } from './routes/receipts';
// @ts-expect-error TanStack Router v1 type inference requires routeTree generation
import { NotificationsPage } from './routes/notifications';
// @ts-expect-error TanStack Router v1 type inference requires routeTree generation
import { RecallsPage } from './routes/recalls';
// @ts-expect-error TanStack Router v1 type inference requires routeTree generation
import { RefundsPage } from './routes/refunds';
// @ts-expect-error TanStack Router v1 type inference requires routeTree generation
import { PatientPortalLayout } from './routes/patient-portal';
// @ts-expect-error TanStack Router v1 type inference requires routeTree generation
import { PatientPortalAppointments } from './routes/patient-portal/appointments';
// @ts-expect-error TanStack Router v1 type inference requires routeTree generation
import { PatientPortalTreatmentPlans } from './routes/patient-portal/treatment-plans';
// @ts-expect-error TanStack Router v1 type inference requires routeTree generation
import { PatientPortalBilling } from './routes/patient-portal/billing';
// @ts-expect-error TanStack Router v1 type inference requires routeTree generation
import { PatientPortalForms } from './routes/patient-portal/forms';
// @ts-expect-error TanStack Router v1 type inference requires routeTree generation
import { PatientPortalDashboard } from './routes/patient-portal/dashboard';
// @ts-expect-error TanStack Router v1 type inference requires routeTree generation
import { PatientPortalLoginPage } from './routes/patient-portal/login';
// @ts-expect-error TanStack Router v1 type inference requires routeTree generation
import { PatientPortalPayments } from './routes/patient-portal/payments';
// @ts-expect-error TanStack Router v1 type inference requires routeTree generation
import { PatientPortalDocuments } from './routes/patient-portal/documents';
// @ts-expect-error TanStack Router v1 type inference requires routeTree generation
import { PatientPortalNotifications } from './routes/patient-portal/notifications';
// @ts-expect-error TanStack Router v1 type inference requires routeTree generation
import { PatientPortalMessages } from './routes/patient-portal/messages';
// @ts-expect-error TanStack Router v1 type inference requires routeTree generation
import { ReportsPage } from './routes/reports';
// @ts-expect-error TanStack Router v1 type inference requires routeTree generation
import { RevenuePage } from './routes/reports/revenue';
// @ts-expect-error TanStack Router v1 type inference requires routeTree generation
import { CollectionsPage } from './routes/reports/collections';
// @ts-expect-error TanStack Router v1 type inference requires routeTree generation
import { ReportsAppointmentsPage } from './routes/reports/appointments';
// @ts-expect-error TanStack Router v1 type inference requires routeTree generation
import { ReportsDashboardPage } from './routes/reports/dashboard';
// @ts-expect-error TanStack Router v1 type inference requires routeTree generation
import { ReportsRecallsPage } from './routes/reports/recalls';
// @ts-expect-error TanStack Router v1 type inference requires routeTree generation
import { ProductionPage } from './routes/reports/production';
// @ts-expect-error TanStack Router v1 type inference requires routeTree generation
import { PractitionersPage } from './routes/reports/practitioners';
// @ts-expect-error TanStack Router v1 type inference requires routeTree generation
import { ReportsPatientsPage } from './routes/reports/patients';

export const dashboardRoute = new Route({
  getParentRoute: () => rootRoute,
  path: '/dashboard',
  component: DashboardIndex,
});

export const loginRoute = new Route({
  getParentRoute: () => rootRoute,
  path: '/login',
  component: LoginPage,
});

export const registerRoute = new Route({
  getParentRoute: () => rootRoute,
  path: '/register',
  component: RegisterPage,
});

export const patientsRoute = new Route({
  getParentRoute: () => rootRoute,
  path: '/patients',
  component: PatientsPage,
});

export const patientDetailRoute = new Route({
  getParentRoute: () => rootRoute,
  path: '/patients/$id',
  component: PatientDetailPage,
});

export const appointmentTypesRoute = new Route({
  getParentRoute: () => rootRoute,
  path: '/appointment-types',
  component: AppointmentTypesPage,
});

export const providersRoute = new Route({
  getParentRoute: () => rootRoute,
  path: '/providers',
  component: ProvidersPage,
});

export const chairsRoute = new Route({
  getParentRoute: () => rootRoute,
  path: '/chairs',
  component: ChairsPage,
});

export const availabilityRoute = new Route({
  getParentRoute: () => rootRoute,
  path: '/availability',
  component: AvailabilityPage,
});

export const appointmentsRoute = new Route({
  getParentRoute: () => rootRoute,
  path: '/appointments',
  component: AppointmentsPage,
});

export const clinicalNotesRoute = new Route({
  getParentRoute: () => rootRoute,
  path: '/clinical-notes',
  component: ClinicalNotesPage,
});

export const templatesRoute = new Route({
  getParentRoute: () => rootRoute,
  path: '/templates',
  component: TemplatesPage,
});

export const dentalChartsRoute = new Route({
  getParentRoute: () => rootRoute,
  path: '/dental-charts',
  component: DentalChartsPage,
});

export const toothConditionsRoute = new Route({
  getParentRoute: () => rootRoute,
  path: '/tooth-conditions',
  component: ToothConditionsPage,
});

export const treatmentHistoryRoute = new Route({
  getParentRoute: () => rootRoute,
  path: '/treatment-history',
  component: TreatmentHistoryPage,
});

export const treatmentPlansRoute = new Route({
  getParentRoute: () => rootRoute,
  path: '/treatment-plans',
  component: TreatmentPlansPage,
});

export const periodontalRecordsRoute = new Route({
  getParentRoute: () => rootRoute,
  path: '/periodontal-records',
  component: PeriodontalRecordsPage,
});

export const imagingStudiesRoute = new Route({
  getParentRoute: () => rootRoute,
  path: '/imaging-studies',
  component: ImagingStudiesPage,
});

export const imagingImagesRoute = new Route({
  getParentRoute: () => rootRoute,
  path: '/imaging-images',
  component: ImagingImagesPage,
});

export const imagingIntegrationsRoute = new Route({
  getParentRoute: () => rootRoute,
  path: '/imaging-integrations',
  component: ImagingIntegrationsPage,
});

export const invoicesRoute = new Route({
  getParentRoute: () => rootRoute,
  path: '/invoices',
  component: InvoicesPage,
});

export const claimIntegrationsRoute = new Route({
  getParentRoute: () => rootRoute,
  path: '/claim-integrations',
  component: ClaimIntegrationsPage,
});

export const statementsRoute = new Route({
  getParentRoute: () => rootRoute,
  path: '/statements',
  component: StatementsPage,
});

export const communicationPreferencesRoute = new Route({
  getParentRoute: () => rootRoute,
  path: '/communication-preferences',
  component: CommunicationPreferencesPage,
});

export const communicationTemplatesRoute = new Route({
  getParentRoute: () => rootRoute,
  path: '/communication-templates',
  component: CommunicationTemplatesPage,
});

export const appointmentRemindersRoute = new Route({
  getParentRoute: () => rootRoute,
  path: '/appointment-reminders',
  component: AppointmentRemindersPage,
});

export const servicesRoute = new Route({
  getParentRoute: () => rootRoute,
  path: '/services',
  component: ServicesPage,
});

export const feesRoute = new Route({
  getParentRoute: () => rootRoute,
  path: '/fees',
  component: FeesPage,
});

export const messagesRoute = new Route({
  getParentRoute: () => rootRoute,
  path: '/messages',
  component: MessagesPage,
});

export const paymentsRoute = new Route({
  getParentRoute: () => rootRoute,
  path: '/payments',
  component: PaymentsPage,
});

export const receiptsRoute = new Route({
  getParentRoute: () => rootRoute,
  path: '/receipts',
  component: ReceiptsPage,
});

export const notificationsRoute = new Route({
  getParentRoute: () => rootRoute,
  path: '/notifications',
  component: NotificationsPage,
});

export const recallsRoute = new Route({
  getParentRoute: () => rootRoute,
  path: '/recalls',
  component: RecallsPage,
});

export const refundsRoute = new Route({
  getParentRoute: () => rootRoute,
  path: '/refunds',
  component: RefundsPage,
});

export const patientPortalRoute = new Route({
  getParentRoute: () => rootRoute,
  path: '/patient-portal',
  component: PatientPortalLayout,
});

export const patientPortalAppointmentsRoute = new Route({
  getParentRoute: () => rootRoute,
  path: '/patient-portal/appointments',
  component: PatientPortalAppointments,
});

export const patientPortalTreatmentPlansRoute = new Route({
  getParentRoute: () => rootRoute,
  path: '/patient-portal/treatment-plans',
  component: PatientPortalTreatmentPlans,
});

export const patientPortalBillingRoute = new Route({
  getParentRoute: () => rootRoute,
  path: '/patient-portal/billing',
  component: PatientPortalBilling,
});

export const patientPortalFormsRoute = new Route({
  getParentRoute: () => rootRoute,
  path: '/patient-portal/forms',
  component: PatientPortalForms,
});

export const patientPortalDashboardRoute = new Route({
  getParentRoute: () => rootRoute,
  path: '/patient-portal/dashboard',
  component: PatientPortalDashboard,
});

export const patientPortalLoginRoute = new Route({
  getParentRoute: () => rootRoute,
  path: '/patient-portal/login',
  component: PatientPortalLoginPage,
});

export const patientPortalPaymentsRoute = new Route({
  getParentRoute: () => rootRoute,
  path: '/patient-portal/payments',
  component: PatientPortalPayments,
});

export const patientPortalDocumentsRoute = new Route({
  getParentRoute: () => rootRoute,
  path: '/patient-portal/documents',
  component: PatientPortalDocuments,
});

export const patientPortalNotificationsRoute = new Route({
  getParentRoute: () => rootRoute,
  path: '/patient-portal/notifications',
  component: PatientPortalNotifications,
});

export const patientPortalMessagesRoute = new Route({
  getParentRoute: () => rootRoute,
  path: '/patient-portal/messages',
  component: PatientPortalMessages,
});

export const reportsRoute = new Route({
  getParentRoute: () => rootRoute,
  path: '/reports',
  component: ReportsPage,
});

export const reportsRevenueRoute = new Route({
  getParentRoute: () => rootRoute,
  path: '/reports/revenue',
  component: RevenuePage,
});

export const reportsCollectionsRoute = new Route({
  getParentRoute: () => rootRoute,
  path: '/reports/collections',
  component: CollectionsPage,
});

export const reportsAppointmentsRoute = new Route({
  getParentRoute: () => rootRoute,
  path: '/reports/appointments',
  component: ReportsAppointmentsPage,
});

export const reportsDashboardRoute = new Route({
  getParentRoute: () => rootRoute,
  path: '/reports/dashboard',
  component: ReportsDashboardPage,
});

export const reportsRecallsRoute = new Route({
  getParentRoute: () => rootRoute,
  path: '/reports/recalls',
  component: ReportsRecallsPage,
});

export const reportsProductionRoute = new Route({
  getParentRoute: () => rootRoute,
  path: '/reports/production',
  component: ProductionPage,
});

export const reportsPractitionersRoute = new Route({
  getParentRoute: () => rootRoute,
  path: '/reports/practitioners',
  component: PractitionersPage,
});

export const reportsPatientsRoute = new Route({
  getParentRoute: () => rootRoute,
  path: '/reports/patients',
  component: ReportsPatientsPage,
});

export const indexRoute = new Route({
  getParentRoute: () => rootRoute,
  path: '/',
  component: () => <div>Redirecting...</div>,
});

export const routeTree = rootRoute.addChildren([dashboardRoute, loginRoute, registerRoute, patientsRoute, patientDetailRoute, appointmentTypesRoute, providersRoute, chairsRoute, availabilityRoute, appointmentsRoute, clinicalNotesRoute, templatesRoute, dentalChartsRoute, toothConditionsRoute, treatmentHistoryRoute, treatmentPlansRoute, periodontalRecordsRoute, imagingStudiesRoute, imagingImagesRoute, imagingIntegrationsRoute, invoicesRoute, claimIntegrationsRoute, statementsRoute, communicationPreferencesRoute, communicationTemplatesRoute, appointmentRemindersRoute, servicesRoute, feesRoute, messagesRoute, paymentsRoute, receiptsRoute, notificationsRoute, recallsRoute, refundsRoute, patientPortalRoute, patientPortalAppointmentsRoute, patientPortalTreatmentPlansRoute, patientPortalBillingRoute, patientPortalFormsRoute, patientPortalDashboardRoute, patientPortalLoginRoute, patientPortalPaymentsRoute, patientPortalDocumentsRoute, patientPortalNotificationsRoute, patientPortalMessagesRoute, reportsRoute, reportsRevenueRoute, reportsCollectionsRoute, reportsAppointmentsRoute, reportsDashboardRoute, reportsRecallsRoute, reportsProductionRoute, reportsPractitionersRoute, reportsPatientsRoute, indexRoute]);
