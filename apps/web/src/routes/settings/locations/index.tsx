import { createFileRoute } from '@tanstack/react-router';
import { LocationSettingsPage } from './-location-settings-page.tsx';

export const Route = createFileRoute('/settings/locations/')({
  component: LocationSettingsPage,
});