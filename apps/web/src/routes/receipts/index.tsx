import { createFileRoute } from '@tanstack/react-router';
import { ReceiptsPage } from './-receipts-page.tsx';

export const Route = createFileRoute('/receipts/')({
  component: ReceiptsPage,
});