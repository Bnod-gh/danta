import { createFileRoute } from '@tanstack/react-router';
import { DashboardIndex } from '../../dashboard/-dashboard-index.tsx';

export const Route = createFileRoute('/$tenantId/dashboard/')({
  component: DashboardIndex,
});
