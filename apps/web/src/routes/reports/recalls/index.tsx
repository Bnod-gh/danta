import { createFileRoute } from '@tanstack/react-router';
import { RecallsPage } from './-recalls-page.tsx';

export const Route = createFileRoute('/reports/recalls/')({
  component: RecallsPage,
});