import { createFileRoute } from '@tanstack/react-router';
import { TemplatesPage } from './-templates-page.tsx';

export const Route = createFileRoute('/templates/')({
  component: TemplatesPage,
});