import { createFileRoute } from '@tanstack/react-router';
import { FeesPage } from './-fees-page.tsx';

export const Route = createFileRoute('/fees/')({
  component: FeesPage,
});