import { createFileRoute } from '@tanstack/react-router';
import { AppointmentRemindersPage } from './-appointment-reminders-page.tsx';

export const Route = createFileRoute('/appointment-reminders/')({
  component: AppointmentRemindersPage,
});