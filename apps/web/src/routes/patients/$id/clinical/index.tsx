import { createFileRoute } from '@tanstack/react-router';
import { PatientClinicalPage } from './-patient-clinical-page.tsx';

export const Route = createFileRoute('/patients/$id/clinical/')({
  component: PatientClinicalPage,
});
