import type { LoaderFunctionArgs } from 'react-router';

import { readPersistedStateFromCookie } from '@/components/Table/utils';
import { carSalesApi } from '@/services';
import { readTableStateFromURL } from '@/utils/urlState';

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
  const columnOrder = urlState?.columnOrder ?? cookieState.columnOrder ?? [];
  const columnVisibility =
    urlState?.columnVisibility ??
    cookieState.columnVisibility ??
    new Set<string>();
  const sorting = urlState?.sorting ?? cookieState.sorting ?? [];
  const columnSizing = cookieState.columnSizing ?? {};

  // Return the promise directly (not awaited) for Suspense streaming
  const carSalesPromise = carSalesApi.fetchCarSalesPaginated({
    limit: 50,
    skip: 0,
    sorting,
  });

  return {
    carSalesPromise,
    columnOrder,
    columnSizing,
    columnVisibility,
    sorting,
  };
};
