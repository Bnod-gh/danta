import { Link, useLocation } from '@tanstack/react-router';
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@danta/ui/breadcrumb";
import { useAuth } from '../../lib/auth-context';

const SEGMENT_LABELS: Record<string, string> = {
  dashboard: 'Dashboard',
  schedule: 'Schedule',
  patients: 'Patients',
  appointments: 'Appointments',
  'appointment-types': 'Appointment Types',
  'clinical-notes': 'Clinical Notes',
  'dental-charts': 'Tooth Charting',
  'treatment-plans': 'Treatment Plans',
  'treatment-history': 'Treatment History',
  'periodontal-records': 'Periodontal Charting',
  templates: 'Templates',
  'imaging-studies': 'Imaging Studies',
  'imaging-images': 'X-Rays',
  'imaging-integrations': 'Imaging Integrations',
  'claim-integrations': 'Insurance Claims',
  invoices: 'Invoices',
  payments: 'Payments',
  refunds: 'Refunds',
  statements: 'Statements',
  receipts: 'Receipts',
  fees: 'Fee Schedule',
  services: 'Services',
  messages: 'Messages',
  notifications: 'Notifications',
  'communication-templates': 'Message Templates',
  'communication-preferences': 'Communication Preferences',
  recalls: 'Recalls',
  reports: 'Reports',
  providers: 'Providers',
  chairs: 'Chairs',
  users: 'Users',
  locations: 'Locations',
  settings: 'Settings',
  subscriptions: 'Subscriptions',
  'api-keys': 'API Keys',
  audit: 'Audit Logs',
  'patient-portal': 'Patient Portal',
  'appointment-reminders': 'Appointment Reminders',
};

/** Singular labels for detail pages whose last segment is a record id. */
const DETAIL_LABELS: Record<string, string> = {
  patients: 'Patient Details',
  appointments: 'Appointment Details',
  'imaging-studies': 'Study Details',
  'imaging-images': 'Image Viewer',
  invoices: 'Invoice Details',
  treatments: 'Treatment Details',
  users: 'User Details',
  providers: 'Provider Details',
};

const UUID_LIKE = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;

function isRecordId(segment: string): boolean {
  return UUID_LIKE.test(segment) || /^PAT-\d+$/i.test(segment);
}

function prettify(segment: string): string {
  return segment.charAt(0).toUpperCase() + segment.slice(1).replace(/-/g, ' ');
}

function labelFor(segment: string, previousSegment: string | undefined): string {
  const mapped = SEGMENT_LABELS[segment];
  if (mapped) return mapped;
  if (isRecordId(segment)) {
    return (previousSegment && DETAIL_LABELS[previousSegment]) || 'Details';
  }
  return prettify(segment);
}

export function Breadcrumbs() {
  const location = useLocation();
  const { user } = useAuth();

  const tenantPrefix = user?.tenantId ? `/${user.tenantId}/dashboard` : '/dashboard';
  const pathname = location.pathname.split('?')[0].split('#')[0];

  let relative = pathname.startsWith(tenantPrefix)
    ? pathname.slice(tenantPrefix.length)
    : pathname;
  if (!relative.startsWith('/')) relative = `/${relative}`;

  // Everything in the app lives at /{tenant}/dashboard/... — the dashboard
  // itself is the root crumb, so drop it from the segment list.
  const segments = relative.split('/').filter(Boolean);
  if (segments[0] === 'dashboard') segments.shift();
  if (segments.length === 0) return null;

  const crumbs = segments.map((segment, index) => ({
    segment,
    label: labelFor(segment, segments[index - 1]),
    href: `${tenantPrefix}/${segments.slice(0, index + 1).join('/')}`,
    isLast: index === segments.length - 1,
  }));

  return (
    <Breadcrumb className="mb-4" aria-label="Breadcrumb">
      <BreadcrumbList>
        <BreadcrumbItem>
          {crumbs.length > 0 ? (
            <BreadcrumbLink asChild>
              <Link
                to={`${tenantPrefix}/dashboard`}
                className="text-muted-foreground transition-colors hover:text-foreground"
              >
                Dashboard
              </Link>
            </BreadcrumbLink>
          ) : (
            <BreadcrumbPage>Dashboard</BreadcrumbPage>
          )}
        </BreadcrumbItem>
        {crumbs.map((crumb) => (
          <BreadcrumbItem key={crumb.href}>
            <BreadcrumbSeparator />
            {crumb.isLast ? (
              <BreadcrumbPage className="text-foreground font-medium">
                {crumb.label}
              </BreadcrumbPage>
            ) : (
              <BreadcrumbLink asChild>
                <Link
                  to={crumb.href}
                  className="text-muted-foreground transition-colors hover:text-foreground"
                >
                  {crumb.label}
                </Link>
              </BreadcrumbLink>
            )}
          </BreadcrumbItem>
        ))}
      </BreadcrumbList>
    </Breadcrumb>
  );
}
