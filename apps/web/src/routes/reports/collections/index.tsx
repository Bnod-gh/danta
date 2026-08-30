import { createFileRoute } from '@tanstack/react-router';
import { CollectionsPage } from './-collections-page.tsx';

export const Route = createFileRoute('/reports/collections/')({
  component: CollectionsPage,
});