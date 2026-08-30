import { createFileRoute } from '@tanstack/react-router';
import { UsersPage } from './-users-page.tsx';

export const Route = createFileRoute('/users/')({
  component: UsersPage,
});