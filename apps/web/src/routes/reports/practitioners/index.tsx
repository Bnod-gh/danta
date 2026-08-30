import { createFileRoute } from '@tanstack/react-router';
import { PractitionersPage } from './-practitioners-page.tsx';

export const Route = createFileRoute('/reports/practitioners/')({
  component: PractitionersPage,
});