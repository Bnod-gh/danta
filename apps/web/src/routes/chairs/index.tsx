import { createFileRoute } from '@tanstack/react-router';
import { ChairsPage } from './-chairs-page.tsx';

export const Route = createFileRoute('/chairs/')({
  component: ChairsPage,
});