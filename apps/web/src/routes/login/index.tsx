import { createFileRoute } from '@tanstack/react-router';
import { LoginPage } from './-login-page.tsx';

export const Route = createFileRoute('/login/')({
  component: LoginPage,
});