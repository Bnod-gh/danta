import { createFileRoute } from '@tanstack/react-router';
import { RevenuePage } from './-revenue-page.tsx';

export const Route = createFileRoute('/reports/revenue/')({
  component: RevenuePage,
});
