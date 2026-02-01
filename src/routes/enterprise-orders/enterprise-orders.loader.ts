import type { LoaderFunctionArgs } from 'react-router';

import type { ColumnFiltersState, SortingState } from '@/components/Table';
import type { EnterpriseOrdersResponse } from '@/services';

import { readPersistedStateFromCookie } from '@/components/Table/utils';
import { enterpriseOrdersApi } from '@/services';
import { encodeStateToURL, readTableStateFromURL } from '@/utils/urlState';

import { PERSISTENCE_KEY } from './EnterpriseOrders.constants';

/**
 * Loader for enterprise orders route
 *
 * Returns a promise that can be used with Suspense for streaming.
 * The route will render immediately with the skeleton while data loads.
 */
export const loader = ({ request }: LoaderFunctionArgs) => {
  const url = new URL(request.url);

  // Read table state from URL params (priority)
  const urlState = readTableStateFromURL({
    persistenceKey: PERSISTENCE_KEY,
    searchParams: url.searchParams,
  });

  // Read persisted state from cookies (fallback)
  const cookieHeader = request.headers.get('Cookie');
  const cookieState = readPersistedStateFromCookie({
    cookieString: cookieHeader ?? undefined,
    persistenceKey: PERSISTENCE_KEY,
  });

  // Merge URL state (priority) with cookie state (fallback)
  const columnOrder: string[] =
    urlState?.columnOrder ?? cookieState.columnOrder ?? [];
  const columnVisibility: Set<string> =
    urlState?.columnVisibility ??
    cookieState.columnVisibility ??
    new Set<string>();

  //  const sorting: SortingState = urlState?.sorting ?? cookieState.sorting ?? [];
  //  const filters: ColumnFiltersState = urlState?.filters ?? cookieState.columnFilters ?? {};
  // Read sorting from standalone param only
  // Don't fall back to cookie - URL is the source of truth for sorting
  // If sort= param is absent, sorting should be empty (user may have reset it)
  const standaloneSortParam = url.searchParams.get('sort');
  const decodedSortParam = standaloneSortParam
    ? decodeURIComponent(standaloneSortParam)
    : null;
  const encodedSortParam = encodeURIComponent(standaloneSortParam ?? '');
  // const encoded64= encodeStateToURL(JSON.parse(standaloneSortParam??'{}'));

  console.log('[LOADER] URL:', request.url);
  console.log('[LOADER] standaloneSortParam:', {
    decodedSortParam,
    encodedSortParam,
    standaloneSortParam,
  });
  let sorting: SortingState = [];
  if (standaloneSortParam) {
    try {
      sorting = JSON.parse(standaloneSortParam) as SortingState;
    } catch {
      // Invalid JSON, use empty array
    }
  }

  // Read filters from standalone param only
  // Don't fall back to cookie - URL is the source of truth for filters
  // If filters= param is absent, filters should be empty (user may have reset them)
  const standaloneFiltersParam = url.searchParams.get('filters');
  let filters: ColumnFiltersState = {};
  if (standaloneFiltersParam) {
    try {
      filters = JSON.parse(standaloneFiltersParam) as ColumnFiltersState;
    } catch {
      // Invalid JSON, use empty object
    }
  }
  console.log('[LOADER] Final sorting:', {
    standaloneFiltersParam,
    standaloneSortParam,
    urlState,
  });

  const columnSizing: Record<string, number> = cookieState.columnSizing ?? {};

  // Return the promise directly (not awaited) for Suspense streaming
  const enterpriseOrdersPromise: Promise<EnterpriseOrdersResponse> =
    enterpriseOrdersApi.fetchEnterpriseOrdersPaginated({
      filter: filters,
      limit: 50,
      requestUrl: request.url,
      skip: 0,
      sorting,
    });

  return {
    columnOrder,
    columnSizing,
    columnVisibility,
    enterpriseOrdersPromise,
    filters,
    key: `${standaloneSortParam ?? ''}${standaloneFiltersParam ?? ''}`,
    sorting,
  };
};
