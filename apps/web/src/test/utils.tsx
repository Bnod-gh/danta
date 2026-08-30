import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render } from '@testing-library/react';
import { type ReactNode } from 'react';

function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: Infinity,
      },
    },
  });
}

export function renderWithQuery(client = createTestQueryClient(), ui: ReactNode) {
  return render(
    <QueryClientProvider client={client}>
      {ui}
    </QueryClientProvider>
  );
}

export function mockLocalStorage() {
  const store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => { store[key] = value; },
    removeItem: (key: string) => { delete store[key]; },
    clear: () => { Object.keys(store).forEach(k => delete store[k]); },
  };
}

export function mockFetch(data: unknown, ok = true) {
  return () => Promise.resolve({
    ok,
    json: () => Promise.resolve(data),
    status: ok ? 200 : 500,
    statusText: ok ? 'OK' : 'Internal Server Error',
  } as Response);
}

export function mockFetchError(message = 'Network error') {
  return () => Promise.resolve({
    ok: false,
    json: () => Promise.resolve({ message }),
    status: 500,
    statusText: 'Internal Server Error',
  } as Response);
}
