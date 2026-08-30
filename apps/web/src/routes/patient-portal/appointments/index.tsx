import { createFileRoute } from '@tanstack/react-router';
import { PatientPortalAppointments } from './-patient-portal-appointments.tsx';

export const Route = createFileRoute('/patient-portal/appointments/')({
  component: PatientPortalAppointments,
});