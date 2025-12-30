import { carSalesApi } from '@/services';

/**
 * Loader for car sales route
 *
 * Returns a promise that can be used with Suspense for streaming.
 * The route will render immediately with the skeleton while data loads.
 */
export const loader = () => {
  // Return the promise directly (not awaited) for Suspense streaming
  const carSalesPromise = carSalesApi.fetchCarSales();

  return {
    carSalesPromise,
  };
};
