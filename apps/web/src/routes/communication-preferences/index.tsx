import { createFileRoute } from '@tanstack/react-router';
import { CommunicationPreferencesPage } from './-communication-preferences-page.tsx';

export const Route = createFileRoute('/communication-preferences/')({
  component: CommunicationPreferencesPage,
});