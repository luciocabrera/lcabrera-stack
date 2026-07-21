import type { SortingState } from '@repo/ui/components/Table';

import { getApiBaseUrl } from '@repo/api/config/get-api-base-url.util';
import { buildPaginatedQueryParams } from '@repo/api/http/build-paginated-query-params.util';
import { fetchAndValidate } from '@repo/api/http/fetch-and-validate.util';
import { createLogger } from '@repo/ui/utils/logger';
import { isObject } from '@repo/utils/guards/is-object.util';

import { fakeDelay } from './fakeDelay.util';

/**
 * Car Sales API Service
 * Handles database queries for car sales data
 */

const log = createLogger({ prefix: '[carSales]' });

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

export const carSalesApi = {
  /**
   * Fetch car sales data with pagination (offset-limit strategy).
   *
   * This is deliberately the only reader of the car-sales table. The API also
   * exposes an unpaginated `GET /car-sales`, but `car_sales` holds 500k rows,
   * so that endpoint returns a ~421MB body and kills SSR while it is being
   * serialized into the hydration payload. Every route takes a bounded slice
   * through here instead — including `car-sales`, which paginates in memory
   * and simply asks for a larger `limit`.
   */
  fetchCarSalesPaginated: async ({
    limit,
    requestUrl,
    skip,
    sorting,
  }: {
    limit: number;
    requestUrl?: string;
    skip: number;
    sorting?: SortingState<CarSale>;
  }) => {
    const params = buildPaginatedQueryParams({ limit, skip, sorting });

    const url = `${getApiBaseUrl(requestUrl)}/car-sales/paginated?${params.toString()}`;
    log.debug('🌐 Fetching from URL:', url);

    await fakeDelay();

    return fetchAndValidate({
      isValid: isCarSalesPaginatedResponse,
      shapeErrorMessage: 'Unexpected response shape from /car-sales/paginated',
      url,
    });
  },
};
