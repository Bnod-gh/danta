import { createFileRoute } from '@tanstack/react-router';
import { ReportsPage } from './-reports-page.tsx';

export const Route = createFileRoute('/reports/')({
  component: ReportsPage,
});