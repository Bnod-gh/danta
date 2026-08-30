import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { RouterProvider, createRouter } from '@tanstack/react-router';
import { QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './lib/auth-context';
import { queryClient } from './lib/query-client';
import { routeTree } from './routeTree.gen';
import { Toaster } from 'sonner';
import { installAuthenticatedFetch } from './lib/api-client';
import './index.css';

installAuthenticatedFetch();
const router = createRouter({ routeTree });

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <RouterProvider router={router} />
        <Toaster position="top-right" richColors />
      </AuthProvider>
    </QueryClientProvider>
  </StrictMode>,
);
