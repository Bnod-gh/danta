import { createFileRoute } from '@tanstack/react-router';
import { SecuritySettingsPage } from './-security-settings-page.tsx';

export const Route = createFileRoute('/settings/security/')({
  component: SecuritySettingsPage,
});