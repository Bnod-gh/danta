import { createFileRoute } from '@tanstack/react-router';
import { AppointmentsPage } from './-appointments-page.tsx';

export const Route = createFileRoute('/appointments/')({
  component: AppointmentsPage,
});