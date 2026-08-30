import { createFileRoute } from '@tanstack/react-router';
import { ProductionPage } from './-production-page.tsx';

export const Route = createFileRoute('/reports/production/')({
  component: ProductionPage,
});