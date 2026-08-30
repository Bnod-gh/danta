import { createFileRoute } from '@tanstack/react-router';
import { PracticeSettingsPage } from './-practice-settings-page.tsx';

export const Route = createFileRoute('/settings/practice/')({
  component: PracticeSettingsPage,
});