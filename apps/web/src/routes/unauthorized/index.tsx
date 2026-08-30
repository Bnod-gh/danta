import { createFileRoute } from '@tanstack/react-router';
import { UnauthorizedPage } from './-unauthorized-page.tsx';

export const Route = createFileRoute('/unauthorized/')({
  component: UnauthorizedPage,
});