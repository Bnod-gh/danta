import { createFileRoute } from '@tanstack/react-router';
import { DashboardIndex } from './-dashboard-index.tsx';

export const Route = createFileRoute('/dashboard/')({
  component: DashboardIndex,
});
