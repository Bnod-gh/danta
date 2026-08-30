import { createFileRoute } from '@tanstack/react-router';
import { LocationsPage } from './-locations-page.tsx';

export const Route = createFileRoute('/locations/')({
  component: LocationsPage,
});