import { createFileRoute } from '@tanstack/react-router';
import { ImagingIntegrationsPage } from './-imaging-integrations-page.tsx';

export const Route = createFileRoute('/imaging-integrations/')({
  component: ImagingIntegrationsPage,
});