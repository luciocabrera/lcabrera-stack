import type { LoaderFunctionArgs } from 'react-router';

import type { CarSale, CarSalesResponse } from '@/services';

import { carSalesApi } from '@/services';
import { readTableLoaderStateFromRequest } from '../utils/readTableLoaderStateFromRequest.util';

import { PERSISTENCE_KEY } from './CarSales.constants';

/**
 * Loader for car sales route
 *
 * Returns a promise that can be used with Suspense for streaming.
 * The route will render immediately with the skeleton while data loads.
 */
export const loader = ({ request }: LoaderFunctionArgs) => {
  const { columnOrder, columnSizing, columnVisibility, sorting } =
    readTableLoaderStateFromRequest<CarSale>({
      persistenceKey: PERSISTENCE_KEY,
      request,
    });

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
