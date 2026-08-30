import { createFileRoute } from '@tanstack/react-router';
import { TreatmentPlansPage } from './-treatment-plans-page.tsx';

export const Route = createFileRoute('/treatment-plans/')({
  component: TreatmentPlansPage,
});