import { createFileRoute } from '@tanstack/react-router';
import { PatientPortalDocuments } from './-patient-portal-documents.tsx';

export const Route = createFileRoute('/patient-portal/documents/')({
  component: PatientPortalDocuments,
});