import { createFileRoute } from '@tanstack/react-router';
import { PatientPortalTreatmentPlans } from './-patient-portal-treatment-plans.tsx';

export const Route = createFileRoute('/patient-portal/treatment-plans/')({
  component: PatientPortalTreatmentPlans,
});