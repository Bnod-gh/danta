import { createFileRoute } from '@tanstack/react-router';
import { AuditPage } from './-audit-page.tsx';

export const Route = createFileRoute('/audit/')({
  component: AuditPage,
});