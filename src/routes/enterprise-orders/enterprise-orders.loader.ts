import type { LoaderFunctionArgs } from 'react-router';

import type { ColumnFiltersState, SortingState } from '@/components/Table';
import type { EnterpriseOrder, EnterpriseOrdersResponse } from '@/services';

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

  // Read persisted state from cookies (fallback)
  const cookieHeader = request.headers.get('Cookie');
  const cookieState = readPersistedStateFromCookie({
    cookieString: cookieHeader ?? undefined,
    persistenceKey: PERSISTENCE_KEY,
  });

  // Merge URL state (priority) with cookie state (fallback)
  const columnOrder = (urlState?.columnOrder ??
    cookieState.columnOrder ??
    []) as (keyof EnterpriseOrder)[];
  const columnVisibility = (urlState?.columnVisibility ??
    cookieState.columnVisibility ??
    new Set()) as Set<keyof EnterpriseOrder>;

  //  const sorting: SortingState = urlState?.sorting ?? cookieState.sorting ?? [];
  //  const filters: ColumnFiltersState = urlState?.filters ?? cookieState.columnFilters ?? {};
  // Read sorting from standalone param only
  // Don't fall back to cookie - URL is the source of truth for sorting
  // If sort= param is absent, sorting should be empty (user may have reset it)
  const standaloneSortParam = url.searchParams.get('sort');

  let sorting: SortingState<EnterpriseOrder> = [];
  if (standaloneSortParam) {
    try {
      sorting = JSON.parse(
        standaloneSortParam,
      ) as SortingState<EnterpriseOrder>;
    } catch {
      // Invalid JSON, use empty array
    }
  }

  // Read filters from standalone param only
  // Don't fall back to cookie - URL is the source of truth for filters
  // If filters= param is absent, filters should be empty (user may have reset them)
  const standaloneFiltersParam = url.searchParams.get('filters');
  let filters: ColumnFiltersState<EnterpriseOrder> = {};
  if (standaloneFiltersParam) {
    try {
      filters = JSON.parse(
        standaloneFiltersParam,
      ) as ColumnFiltersState<EnterpriseOrder>;
    } catch {
      // Invalid JSON, use empty object
    }
  }

  const columnSizing: Record<keyof EnterpriseOrder, number> =
    (cookieState.columnSizing ?? {}) as Record<keyof EnterpriseOrder, number>;

  // Return the promise directly (not awaited) for Suspense streaming
  const enterpriseOrdersPromise: Promise<EnterpriseOrdersResponse> =
    enterpriseOrdersApi.fetchEnterpriseOrdersPaginated({
      filter: filters,
      limit: 50,
      requestUrl: request.url,
      skip: 0,
      sorting: sorting.filter(
        (
          s,
        ): s is {
          columnKey: keyof EnterpriseOrder;
          direction: 'asc' | 'desc';
        } => s.direction !== undefined && s.columnKey !== 'actions',
      ),
    });

  return {
    columnOrder,
    columnSizing,
    columnVisibility,
    enterpriseOrdersPromise,
    filters,
    key: `${standaloneSortParam ?? ''}${standaloneFiltersParam ?? ''}`,
    sorting: sorting.filter(
      (
        s,
      ): s is { columnKey: keyof EnterpriseOrder; direction: 'asc' | 'desc' } =>
        s.direction !== undefined && s.columnKey !== 'actions',
    ),
  };
};
