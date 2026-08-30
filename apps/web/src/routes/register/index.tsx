import { createFileRoute } from '@tanstack/react-router';
import { RegisterPage } from './-register-page.tsx';

export const Route = createFileRoute('/register/')({
  component: RegisterPage,
});