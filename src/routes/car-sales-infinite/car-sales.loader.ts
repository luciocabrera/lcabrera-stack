import type { LoaderFunctionArgs } from 'react-router';

import type { ColumnFiltersState, SortingState } from '@/components/Table';
import type { CarSale, CarSalesResponse } from '@/services';

import { readPersistedStateFromCookie } from '@/components/Table/utils';
import { carSalesApi } from '@/services';
import { readTableStateFromURL } from '@/utils/urlState';

import { PERSISTENCE_KEY } from './CarSales.constants';

/**
 * Loader for car sales infinite route
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
    []) as (keyof CarSale)[];
  const columnVisibility = (urlState?.columnVisibility ??
    cookieState.columnVisibility ??
    new Set()) as Set<keyof CarSale>;

  // Read sorting from standalone param only
  // Don't fall back to cookie - URL is the source of truth for sorting
  const standaloneSortParam = url.searchParams.get('sort');

  let sorting: SortingState<CarSale> = [];
  if (standaloneSortParam) {
    try {
      sorting = JSON.parse(standaloneSortParam) as SortingState<CarSale>;
    } catch {
      // Invalid JSON, use empty array
    }
  }

  // Read filters from standalone param only
  const standaloneFiltersParam = url.searchParams.get('filters');
  let filters: ColumnFiltersState<CarSale> = {};
  if (standaloneFiltersParam) {
    try {
      filters = JSON.parse(
        standaloneFiltersParam,
      ) as ColumnFiltersState<CarSale>;
    } catch {
      // Invalid JSON, use empty object
    }
  }

  const columnSizing: Record<keyof CarSale, number> =
    (cookieState.columnSizing ?? {}) as Record<keyof CarSale, number>;

  // Return the promise directly (not awaited) for Suspense streaming
  const carSalesPromise: Promise<CarSalesResponse & { hasMore: boolean }> =
    carSalesApi.fetchCarSalesPaginated({
      limit: 50,
      requestUrl: request.url,
      skip: 0,
      sorting: sorting.filter(
        (
          s,
        ): s is { columnKey: keyof CarSale; direction: 'asc' | 'desc' } =>
          s.direction !== undefined,
      ),
    });

  return {
    carSalesPromise,
    columnOrder,
    columnSizing,
    columnVisibility,
    filters,
    key: `${standaloneSortParam ?? ''}${standaloneFiltersParam ?? ''}`,
    sorting: sorting.filter(
      (
        s,
      ): s is { columnKey: keyof CarSale; direction: 'asc' | 'desc' } =>
        s.direction !== undefined,
    ),
  };
};
