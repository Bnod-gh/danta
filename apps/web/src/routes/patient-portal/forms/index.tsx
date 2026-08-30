import { createFileRoute } from '@tanstack/react-router';
import { PatientPortalForms } from './-patient-portal-forms.tsx';

export const Route = createFileRoute('/patient-portal/forms/')({
  component: PatientPortalForms,
});