import { createFileRoute } from '@tanstack/react-router';
import { PatientDetailPage } from './-patient-detail-page.tsx';

export const Route = createFileRoute('/patients/$id')({
  component: PatientDetailPage,
});