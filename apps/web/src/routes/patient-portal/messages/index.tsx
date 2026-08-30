import { createFileRoute } from '@tanstack/react-router';
import { PatientPortalMessages } from './-patient-portal-messages.tsx';

export const Route = createFileRoute('/patient-portal/messages/')({
  component: PatientPortalMessages,
});