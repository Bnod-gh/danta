import { createFileRoute } from '@tanstack/react-router';
import { CommunicationTemplatesPage } from './-communication-templates-page.tsx';

export const Route = createFileRoute('/communication-templates/')({
  component: CommunicationTemplatesPage,
});