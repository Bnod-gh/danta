import { createFileRoute } from '@tanstack/react-router';
import { AppointmentsPage } from './-appointments-page.tsx';

export const Route = createFileRoute('/reports/appointments/')({
  component: AppointmentsPage,
});