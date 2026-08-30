import { createFileRoute } from '@tanstack/react-router';
import { StatementsPage } from './-statements-page.tsx';

export const Route = createFileRoute('/statements/')({
  component: StatementsPage,
});