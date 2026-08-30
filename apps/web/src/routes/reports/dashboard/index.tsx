import { createFileRoute } from '@tanstack/react-router';
import { DashboardPage } from './-dashboard-page.tsx';

export const Route = createFileRoute('/reports/dashboard/')({
  component: DashboardPage,
});