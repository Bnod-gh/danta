import { createFileRoute } from '@tanstack/react-router';
import { PaymentsPage } from './-payments-page.tsx';

export const Route = createFileRoute('/payments/')({
  component: PaymentsPage,
});