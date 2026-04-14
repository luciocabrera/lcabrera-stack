import type { LoaderFunctionArgs } from 'react-router';

import type { CarSale, CarSalesResponse } from '@/services';

import { INITIAL_PAGE_SIZE } from '@/components/Table/Table.constants';
import { carSalesApi } from '@/services';
import { readTableLoaderStateFromRequest } from '../utils/readTableLoaderStateFromRequest.util';

import { PERSISTENCE_KEY } from './CarSales.constants.tsx';

/**
 * Loader for car sales infinite route
 *
 * Returns a promise that can be used with Suspense for streaming.
 * The route will render immediately with the skeleton while data loads.
 */
export const loader = ({ request }: LoaderFunctionArgs) => {
  const {
    columnOrder,
    columnSizing,
    columnVisibility,
    filters,
    standaloneFiltersParam,
    standaloneSortParam,
    sorting,
  } = readTableLoaderStateFromRequest<CarSale>({
    includeFilters: true,
    persistenceKey: PERSISTENCE_KEY,
    request,
  });

  // Return the promise directly (not awaited) for Suspense streaming
  const carSalesPromise: Promise<CarSalesResponse & { hasMore: boolean }> =
    carSalesApi.fetchCarSalesPaginated({
      limit: INITIAL_PAGE_SIZE,
      requestUrl: request.url,
      skip: 0,
      sorting: sorting.filter(
        (s): s is { columnKey: keyof CarSale; direction: 'asc' | 'desc' } =>
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
      (s): s is { columnKey: keyof CarSale; direction: 'asc' | 'desc' } =>
        s.direction !== undefined,
    ),
  };
};
