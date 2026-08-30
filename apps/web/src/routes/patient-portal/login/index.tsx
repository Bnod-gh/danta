import { createFileRoute } from '@tanstack/react-router';
import { PatientPortalLoginPage } from './-patient-portal-login-page.tsx';

export const Route = createFileRoute('/patient-portal/login/')({
  component: PatientPortalLoginPage,
});