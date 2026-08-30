import { apiGet } from './request';
import type { SearchResults } from '@danta/schemas';

export async function searchAll(q: string): Promise<SearchResults> {
  return apiGet('/search', { q });
}
