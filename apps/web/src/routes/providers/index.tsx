import { createFileRoute } from '@tanstack/react-router';
import { ProvidersPage } from './-providers-page.tsx';

export const Route = createFileRoute('/providers/')({
  component: ProvidersPage,
});