import { createFileRoute } from '@tanstack/react-router';
import { DashboardExamplePage } from './-dashboard-example-page';

export const Route = createFileRoute('/dashboard-example/')({
  component: DashboardExamplePage,
});
