import { createFileRoute } from '@tanstack/react-router';
import { ClinicalNotesPage } from './-clinical-notes-page.tsx';

export const Route = createFileRoute('/clinical-notes/')({
  component: ClinicalNotesPage,
});