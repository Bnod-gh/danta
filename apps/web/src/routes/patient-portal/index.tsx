import { createFileRoute, redirect } from '@tanstack/react-router';
import { PatientPortalLayout } from './-patient-portal-layout.tsx';

export const Route = createFileRoute('/patient-portal/')({
  beforeLoad: () => {
    const token = localStorage.getItem('patientAccessToken');
    if (!token) {
      throw redirect({ to: '/patient-portal/login' });
    }
  },
  component: PatientPortalLayout,
});
