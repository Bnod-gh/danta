import { QueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { formatError } from './format-error';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60,
      gcTime: 1000 * 60 * 10,
      retry: 2,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    },
    mutations: {
      onError: (error) => {
        // Error messages are human-readable by the time they reach the UI
        // (api-client extracts them from the response body).
        toast.error(formatError(error));
      },
    },
  },
});

// eslint-disable-next-line @typescript-eslint/no-explicit-any
(queryClient.getQueryCache().config as any).onError = (error: Error) => {
  toast.error(formatError(error));
};
