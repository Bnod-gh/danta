import { createFileRoute } from '@tanstack/react-router';
import { RefundsPage } from './-refunds-page.tsx';

export const Route = createFileRoute('/refunds/')({
  component: RefundsPage,
});