import { createFileRoute } from '@tanstack/react-router';
import { SchedulePage } from './-schedule-page.tsx';

export const Route = createFileRoute('/schedule/')({
  component: SchedulePage,
});
