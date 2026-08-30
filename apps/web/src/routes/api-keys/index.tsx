import { createFileRoute } from '@tanstack/react-router';
import { ApiKeysPage } from './-api-keys-page.tsx';

export const Route = createFileRoute('/api-keys/')({
  component: ApiKeysPage,
});