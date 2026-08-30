import axios, { AxiosError, InternalAxiosRequestConfig, AxiosResponse } from 'axios';

export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api/v1',
  timeout: 15_000,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

let refreshPromise: Promise<boolean> | null = null;

/** Adds credentials: 'include' to legacy fetch-based screens and handles 401 retries. */
export function installAuthenticatedFetch() {
  if (typeof window === 'undefined' || (window.fetch as typeof fetch & { __dantaAuth?: boolean }).__dantaAuth) return;
  const nativeFetch = window.fetch.bind(window);
  const refreshAccessToken = async (): Promise<boolean> => {
    if (!refreshPromise) {
      refreshPromise = nativeFetch('/api/v1/auth/refresh', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
      }).then(async (response) => {
        return response.ok;
      }).catch(() => false).finally(() => {
        refreshPromise = null;
      });
    }
    return refreshPromise;
  };
  const authenticatedFetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url;
    const isApiRequest = url.startsWith('/api/') || url.startsWith(window.location.origin + '/api/');
    if (!isApiRequest) return nativeFetch(input, init);
    
    // Always include credentials for our API
    const newInit = { ...init, credentials: 'include' as RequestCredentials };
    const response = await nativeFetch(input, newInit);
    
    if (response.status !== 401 || url.includes('/auth/login') || url.includes('/auth/refresh') || url.includes('/auth/logout')) {
      return response;
    }
    
    const refreshed = await refreshAccessToken();
    if (!refreshed) return response;
    
    // Retry original request (cookies updated automatically)
    return nativeFetch(input, newInit);
  }) as typeof fetch & { __dantaAuth?: boolean };
  authenticatedFetch.__dantaAuth = true;
  window.fetch = authenticatedFetch;
}

apiClient.interceptors.response.use(
  (response: AxiosResponse) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    if (error.response?.status === 401 && !originalRequest._retry) {
      const url = originalRequest.url || '';
      if (url.includes('/auth/login') || url.includes('/auth/refresh') || url.includes('/auth/logout')) {
        return Promise.reject(new Error(extractReadableMessage(error, 'Unable to sign in. Please check your details and try again.')));
      }

      originalRequest._retry = true;
      try {
        if (!refreshPromise) {
          refreshPromise = apiClient
            .post('/auth/refresh')
            .then(() => true)
            .catch(() => false)
            .finally(() => {
              refreshPromise = null;
            });
        }
        const refreshed = await refreshPromise;
        if (!refreshed) {
          throw new Error('Refresh failed');
        }
        return apiClient(originalRequest);
      } catch {
        if (typeof window !== 'undefined') {
          window.location.href = '/login';
        }
        return Promise.reject(new Error('Your session has expired. Please sign in again.'));
      }
    }

    if (error.response?.status === 403) {
      return Promise.reject(new Error(extractReadableMessage(error, 'You do not have permission to perform this action.')));
    }

    if (error.response?.status === 429) {
      return Promise.reject(new Error(extractReadableMessage(error, 'Too many requests. Please wait a moment and try again.')));
    }

    if (!error.response) {
      return Promise.reject(new Error('Cannot reach the server. Check your connection and try again.'));
    }

    if (error.response.status >= 500) {
      return Promise.reject(new Error(extractReadableMessage(error, 'Something went wrong on our side. Please try again shortly.')));
    }

    return Promise.reject(new Error(extractReadableMessage(error, 'The request could not be completed. Please review the details and try again.')));
  },
);

function extractReadableMessage(error: AxiosError, fallback: string): string {
  const data = error.response?.data as { message?: unknown; error?: string } | string | undefined;
  if (typeof data === 'string' && data.trim()) return data.trim();
  if (data && typeof data === 'object') {
    if (typeof data.message === 'string' && data.message.trim()) return data.message.trim();
    if (Array.isArray(data.message)) {
      const parts = data.message.filter((item): item is string => typeof item === 'string' && !!item.trim());
      if (parts.length) return parts.join(' · ');
    }
    if (typeof data.error === 'string' && data.error.trim() && !/^\w+(\.\w+)*$/.test(data.error)) return data.error.trim();
  }
  if (error.code === 'ECONNABORTED') return 'The request timed out. Please try again.';
  return fallback;
}
