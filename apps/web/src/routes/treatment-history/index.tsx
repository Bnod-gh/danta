import { createFileRoute } from '@tanstack/react-router';
import { TreatmentHistoryPage } from './-treatment-history-page.tsx';

export const Route = createFileRoute('/treatment-history/')({
  component: TreatmentHistoryPage,
});