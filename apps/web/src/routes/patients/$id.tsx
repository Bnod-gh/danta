import { createFileRoute, Outlet, useMatches } from '@tanstack/react-router';
import { PatientDetailPage } from './-patient-detail-page.tsx';

export const Route = createFileRoute('/patients/$id')({
  component: PatientDetailLayout,
});

function PatientDetailLayout() {
  const matches = useMatches();
  const isClinical = matches.some((m) => m.id === '/patients/$id/clinical');

  if (isClinical) {
    return <Outlet />;
  }

  return <PatientDetailPage />;
}
