import { createFileRoute } from '@tanstack/react-router';
import { ClaimIntegrationsPage } from './-claim-integrations-page.tsx';

export const Route = createFileRoute('/claim-integrations/')({
  component: ClaimIntegrationsPage,
});