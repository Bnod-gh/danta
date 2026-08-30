import { createFileRoute } from '@tanstack/react-router';
import { OrganisationSettingsPage } from './-organisation-settings-page.tsx';

export const Route = createFileRoute('/settings/organisation/')({
  component: OrganisationSettingsPage,
});