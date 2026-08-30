import { createFileRoute } from '@tanstack/react-router';
import { RolesPage } from './-roles-page.tsx';

export const Route = createFileRoute('/roles/')({
  component: RolesPage,
});