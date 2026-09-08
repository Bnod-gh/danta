import { createFileRoute } from '@tanstack/react-router';
import { ClinicalSettingsPage } from './-clinical-settings-page.tsx';

export const Route = createFileRoute('/settings/clinical/')({
  component: ClinicalSettingsPage,
});
