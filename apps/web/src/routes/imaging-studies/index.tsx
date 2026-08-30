import { createFileRoute } from '@tanstack/react-router';
import { ImagingStudiesPage } from './-imaging-studies-page.tsx';

export const Route = createFileRoute('/imaging-studies/')({
  component: ImagingStudiesPage,
});