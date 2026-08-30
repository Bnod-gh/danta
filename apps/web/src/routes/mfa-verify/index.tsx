import { createFileRoute } from '@tanstack/react-router';
import { MfaVerifyPage } from './-mfa-verify-page';

export const Route = createFileRoute('/mfa-verify/')({
  component: MfaVerifyPage,
});
