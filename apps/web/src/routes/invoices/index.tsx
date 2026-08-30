import { createFileRoute } from '@tanstack/react-router';
import { InvoicesPage } from './-invoices-page.tsx';

export const Route = createFileRoute('/invoices/')({
  component: InvoicesPage,
});