import type { PaginatedFetchArgs } from '@lcabrera/api/http/http.types';

import { getApiBaseUrl } from '@lcabrera/api/config/get-api-base-url.util';
import { createPaginatedFetcher } from '@lcabrera/api/http/create-paginated-fetcher.util';
import { isObject } from '@lcabrera/utils/guards/is-object.util';

import { fakeDelay } from './fakeDelay.util';

/**
 * Car Sales API Service
 * Handles database queries for car sales data
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

const fetchPage = createPaginatedFetcher({
  isValid: isCarSalesPaginatedResponse,
  path: '/car-sales/paginated',
  resolveBaseUrl: getApiBaseUrl,
});

/**
 * Fetch car sales data with pagination (offset-limit strategy).
 *
 * This is deliberately the only reader of the car-sales table. The API also
 * exposes an unpaginated `GET /car-sales`, but `car_sales` holds 500k rows,
 * so that endpoint returns a ~421MB body and kills SSR while it is being
 * serialized into the hydration payload. Every route takes a bounded slice
 * through here instead — including `car-sales`, which paginates in memory
 * and simply asks for a larger `limit`.
 *
 * The `fakeDelay` is why this wraps the fetcher rather than being one: the
 * route exists to demonstrate the loading skeleton, which a local API answers
 * too fast to show. It no-ops unless `VITE_API_DELAY_MS` is set.
 */
export const fetchCarSalesPage = async (args: PaginatedFetchArgs) => {
  await fakeDelay();

  return fetchPage(args);
};
