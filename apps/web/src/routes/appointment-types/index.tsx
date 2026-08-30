import { createFileRoute } from '@tanstack/react-router';
import { AppointmentTypesPage } from './-appointment-types-page.tsx';

export const Route = createFileRoute('/appointment-types/')({
  component: AppointmentTypesPage,
});