import { createFileRoute } from '@tanstack/react-router';
import { PatientPortalNotifications } from './-patient-portal-notifications.tsx';

export const Route = createFileRoute('/patient-portal/notifications/')({
  component: PatientPortalNotifications,
});