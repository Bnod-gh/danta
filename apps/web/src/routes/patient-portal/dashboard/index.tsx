import { createFileRoute } from '@tanstack/react-router';
import { PatientPortalDashboard } from './-patient-portal-dashboard.tsx';

export const Route = createFileRoute('/patient-portal/dashboard/')({
  component: PatientPortalDashboard,
});