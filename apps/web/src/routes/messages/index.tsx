import { createFileRoute } from '@tanstack/react-router';
import { MessagesPage } from './-messages-page.tsx';

export const Route = createFileRoute('/messages/')({
  component: MessagesPage,
});