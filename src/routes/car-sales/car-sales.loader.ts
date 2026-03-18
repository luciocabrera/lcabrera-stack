import type { LoaderFunctionArgs } from 'react-router';

import type { ColumnSizingState, SortingState } from '@/components/Table';
import type { CarSale, CarSalesResponse } from '@/services';

import { readPersistedStateFromCookie } from '@/components/Table/utils';
import { carSalesApi } from '@/services';
import {
  deserializeSortingFromURL,
  readTableStateFromURL,
} from '@/utils/urlState';

import { PERSISTENCE_KEY } from './CarSales.constants';

/**
 * Loader for car sales route
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
  const standaloneSortParam = url.searchParams.get('sort');

  let sorting: SortingState<CarSale> = [];
  if (standaloneSortParam) {
    sorting = deserializeSortingFromURL<CarSale>(standaloneSortParam);
  }

  const columnSizing: ColumnSizingState<CarSale> = (cookieState.columnSizing ??
    {}) as ColumnSizingState<CarSale>;

  // Return the promise directly (not awaited) for Suspense streaming
  const carSalesPromise: Promise<CarSalesResponse> = carSalesApi.fetchCarSales(
    request.url,
  );

  return {
    carSalesPromise,
    columnOrder,
    columnSizing,
    columnVisibility,
    sorting: sorting.filter(
      (s): s is { columnKey: keyof CarSale; direction: 'asc' | 'desc' } =>
        s.direction !== undefined,
    ),
  };
};
