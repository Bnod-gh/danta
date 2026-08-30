import { useEffect } from 'react';
import { useQuery, type UseQueryOptions, type UseQueryResult } from '@tanstack/react-query';
import { toast } from 'sonner';
import { formatError } from '../format-error';

export function useApiQuery<TData, TError>(
  options: UseQueryOptions<TData, TError>,
): UseQueryResult<TData, TError> {
  const query = useQuery(options);
  useEffect(() => {
    if (!query.error) return;
    // Error messages are human-readable by the time they reach the UI
    // (api-client extracts them from the response body).
    toast.error(formatError(query.error));
  }, [query.error]);
  return query;
}
