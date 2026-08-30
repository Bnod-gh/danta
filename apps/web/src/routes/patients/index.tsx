import { createFileRoute } from '@tanstack/react-router';
import { PatientsPage } from './-patients-page.tsx';

export const Route = createFileRoute('/patients/')({
  component: PatientsPage,
});