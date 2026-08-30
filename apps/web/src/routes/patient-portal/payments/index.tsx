import { createFileRoute } from '@tanstack/react-router';
import { PatientPortalPayments } from './-patient-portal-payments.tsx';

export const Route = createFileRoute('/patient-portal/payments/')({
  component: PatientPortalPayments,
});