import { createFileRoute } from '@tanstack/react-router';
import { NotificationsPage } from './-notifications-page.tsx';

export const Route = createFileRoute('/notifications/')({
  component: NotificationsPage,
});