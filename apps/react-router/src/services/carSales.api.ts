import type { PaginatedFetchArgs } from '@lcabrera/api/http/http.types';

import { getApiBaseUrl } from '@lcabrera/api/config/get-api-base-url.util';
import { createPaginatedFetcher } from '@lcabrera/api/http/create-paginated-fetcher.util';
import { isObject } from '@lcabrera/utils/guards/is-object.util';

import { fakeDelay } from './fakeDelay.util';
import { isExternalApiEnabled } from './isExternalApiEnabled.util';

/**
 * Browser fetcher for a page of car sales.
 *
 * It targets this app's own `/_api/car-sales/paginated` resource route by
 * default, and the external `car-sales-api` when `VITE_API_URL` is set — the
 * one axis the two differ on is the origin, which is exactly what
 * `createPaginatedFetcher`'s `resolveBaseUrl` strategy is for (ADR-056).
 */

export type CarSale = {
  readonly buyer_address: string;
  readonly buyer_email: string;
  readonly buyer_name: string;
  readonly buyer_phone: string;
  readonly car_id: number;
  readonly city: null | string;
  readonly color: string;
  readonly country: null | string;
  readonly date_of_ingress: string;
  readonly date_of_sale: string;
  readonly engine: string;
  readonly fuel_type: string;
  readonly insurance_expiration_date: string;
  readonly insurance_policy_number: string;
  readonly insurance_provider: string;
  readonly loan_amount: number;
  readonly loan_provider: string;
  readonly mileage: number;
  readonly model: string;
  readonly postal_code: null | string;
  readonly profit: number;
  readonly purchase_price: number;
  readonly sale_price: number;
  readonly seller_address: string;
  readonly seller_email: string;
  readonly seller_name: string;
  readonly seller_phone: string;
  readonly state: null | string;
  readonly transmission: string;
  readonly year: number;
};

export type CarSalesResponse = {
  readonly data: readonly CarSale[];
  readonly total: number;
};

const isCarSalesPaginatedResponse = (
  value: unknown,
): value is CarSalesResponse & { hasMore: boolean } =>
  isObject(value) &&
  Array.isArray(value.data) &&
  typeof value.total === 'number' &&
  typeof value.hasMore === 'boolean';

/**
 * The same-origin resource route this app serves for its own car-sales rows.
 * Exported so `routes.ts` and this fetcher can be asserted to still name the
 * same URL — they are declared in different shapes and nothing else pairs them.
 */
export const CAR_SALES_PAGINATED_PATH = '/_api/car-sales/paginated';

/** This app's own resource route, reading Postgres server-side. The default. */
const fetchSelfHostedPage = createPaginatedFetcher({
  isValid: isCarSalesPaginatedResponse,
  path: CAR_SALES_PAGINATED_PATH,
});

/** The external `car-sales-api` endpoint, reachable only under the override. */
const fetchExternalPage = createPaginatedFetcher({
  isValid: isCarSalesPaginatedResponse,
  path: '/car-sales/paginated',
  resolveBaseUrl: getApiBaseUrl,
});

/**
 * Fetch car sales data with pagination (offset-limit strategy).
 *
 * This is deliberately the only reader of the car-sales table. `car_sales`
 * holds 500k rows, so an unpaginated read returns a ~421MB body and kills SSR
 * while it is being serialized into the hydration payload. Every route takes a
 * bounded slice through here instead — including `car-sales`, which paginates
 * in memory and simply asks for a larger `limit`.
 *
 * Both endpoints answer the identical `{ data, hasMore, total }` shape, so the
 * override changes where the rows come from and nothing else.
 *
 * The `fakeDelay` is why this wraps the fetcher rather than being one: the
 * route exists to demonstrate the loading skeleton, which a local endpoint
 * answers too fast to show. It no-ops unless `VITE_API_DELAY_MS` is set.
 */
export const fetchCarSalesPage = async (args: PaginatedFetchArgs) => {
  await fakeDelay();

  return isExternalApiEnabled()
    ? fetchExternalPage(args)
    : fetchSelfHostedPage(args);
};
