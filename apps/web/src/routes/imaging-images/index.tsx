import { createFileRoute } from '@tanstack/react-router';
import { ImagingImagesPage } from './-imaging-images-page.tsx';

export const Route = createFileRoute('/imaging-images/')({
  component: ImagingImagesPage,
});