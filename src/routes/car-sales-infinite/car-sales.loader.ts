import type { LoaderFunctionArgs } from 'react-router';

import { carSalesApi } from '@/services';
import { readPersistedStateFromCookie } from '@/components/Table/hooks/tablePersistence.helper';

/**
 * Loader for car sales route
 *
 * Returns a promise that can be used with Suspense for streaming.
 * The route will render immediately with the skeleton while data loads.
 */
export const loader = ({ request }: LoaderFunctionArgs) => {
  // Parse sorting from URL search params
  const url = new URL(request.url);
  const sortParam = url.searchParams.get('sort');
  const sorting = sortParam ? JSON.parse(sortParam) : undefined;

  // Read persisted column widths from cookies
  const cookieHeader = request.headers.get('Cookie');
  const persistedState = readPersistedStateFromCookie({
    cookieString: cookieHeader ?? undefined,
    persistenceKey: 'car-sales-infinite-table',
  });

  // Return the promise directly (not awaited) for Suspense streaming
  const carSalesPromise = carSalesApi.fetchCarSalesPaginated(0, 50, sorting);

  return {
    carSalesPromise,
    columnSizing: persistedState.columnSizing ?? {},
    sorting,
  };
};
