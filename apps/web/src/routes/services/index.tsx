import { createFileRoute } from '@tanstack/react-router';
import { ServicesPage } from './-services-page.tsx';

export const Route = createFileRoute('/services/')({
  component: ServicesPage,
});
