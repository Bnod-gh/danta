import { createFileRoute } from '@tanstack/react-router';
import { ToothConditionsPage } from './-tooth-conditions-page.tsx';

export const Route = createFileRoute('/tooth-conditions/')({
  component: ToothConditionsPage,
});