import type { LoaderFunctionArgs } from 'react-router';

import type { ColumnFiltersState, SortingState } from '@/components/Table';
import type { EnterpriseOrdersResponse } from '@/services';

import { readPersistedStateFromCookie } from '@/components/Table/utils';
import { enterpriseOrdersApi } from '@/services';
import { readTableStateFromURL } from '@/utils/urlState';

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

  // Read standalone filters param (for server-side filtering)
  const filtersParam = url.searchParams.get('filters');
  const filtersFromParam: ColumnFiltersState | undefined = filtersParam
    ? (JSON.parse(filtersParam) as ColumnFiltersState)
    : undefined;

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
  const sorting: SortingState = urlState?.sorting ?? cookieState.sorting ?? [];
  // Use standalone filters param (priority), then urlState, then cookie
  const filters: ColumnFiltersState =
    filtersFromParam ?? urlState?.filters ?? cookieState.columnFilters ?? {};
  const columnSizing: Record<string, number> = cookieState.columnSizing ?? {};

  console.warn('🔍 [Loader] URL State:', urlState);
  console.warn('🔍 [Loader] Standalone filters param:', filtersFromParam);
  console.warn('🔍 [Loader] Cookie State:', cookieState);
  console.warn('🔍 [Loader] Final filters:', filters);
  console.warn('🔍 [Loader] Final sorting:', sorting);

  // Return the promise directly (not awaited) for Suspense streaming
  const enterpriseOrdersPromise: Promise<
    EnterpriseOrdersResponse & { hasMore: boolean }
  > = enterpriseOrdersApi.fetchEnterpriseOrdersPaginated({
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
    sorting,
  };
};
