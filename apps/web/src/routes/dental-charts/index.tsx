import { createFileRoute } from '@tanstack/react-router';
import { DentalChartsPage } from './-dental-charts-page.tsx';

export const Route = createFileRoute('/dental-charts/')({
  component: DentalChartsPage,
});