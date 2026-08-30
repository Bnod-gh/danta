import { createFileRoute } from '@tanstack/react-router';
import { PatientPortalBilling } from './-patient-portal-billing.tsx';

export const Route = createFileRoute('/patient-portal/billing/')({
  component: PatientPortalBilling,
});