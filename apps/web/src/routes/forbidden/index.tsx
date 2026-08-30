import { createFileRoute } from '@tanstack/react-router';
import { ForbiddenPage } from './-forbidden-page.tsx';

export const Route = createFileRoute('/forbidden/')({
  component: ForbiddenPage,
});