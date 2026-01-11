import type { LoaderFunctionArgs } from 'react-router';

import { readPersistedStateFromCookie } from '@/components/Table/utils';
import { enterpriseOrdersApi } from '@/services';
import { readTableStateFromURL } from '@/utils/urlState';

const PERSISTENCE_KEY = 'enterprise-orders-table';

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
  const columnOrder = urlState?.columnOrder ?? cookieState.columnOrder ?? [];
  const columnVisibility =
    urlState?.columnVisibility ??
    cookieState.columnVisibility ??
    new Set<string>();
  const sorting = urlState?.sorting ?? cookieState.sorting ?? [];
  const filters = urlState?.filters ?? cookieState.columnFilters ?? {};
  const columnSizing = cookieState.columnSizing ?? {};

  // Return the promise directly (not awaited) for Suspense streaming
  const enterpriseOrdersPromise =
    enterpriseOrdersApi.fetchEnterpriseOrdersPaginated({
      filter: filters,
      limit: 50,
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
