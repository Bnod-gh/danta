import { createFileRoute } from '@tanstack/react-router';
import { PeriodontalRecordsPage } from './-periodontal-records-page.tsx';

export const Route = createFileRoute('/periodontal-records/')({
  component: PeriodontalRecordsPage,
});