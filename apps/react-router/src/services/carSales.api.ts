import {
  buildPaginatedQueryParams,
  fakeDelay,
  fetchAndValidate,
  getApiBaseUrl,
} from '@repo/api/api';
import { createLogger } from '@repo/ui/utils/logger';
import { isObject } from '@repo/ui/utils/typeGuards';

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

const isCarSalesResponse = (value: unknown): value is CarSalesResponse =>
  isObject(value) &&
  Array.isArray(value['data']) &&
  typeof value['total'] === 'number';

const isCarSalesPaginatedResponse = (
  value: unknown,
): value is CarSalesResponse & { hasMore: boolean } =>
  isObject(value) &&
  Array.isArray(value['data']) &&
  typeof value['total'] === 'number' &&
  typeof value['hasMore'] === 'boolean';

export const carSalesApi = {
  /**
   * Fetch car sales data
   * Returns a promise (non-blocking) to enable React streaming with Suspense
   */
  fetchCarSales: async (requestUrl?: string): Promise<CarSalesResponse> => {
    await fakeDelay();

    return fetchAndValidate({
      isValid: isCarSalesResponse,
      shapeErrorMessage: 'Unexpected response shape from /car-sales',
      url: `${getApiBaseUrl(requestUrl)}/car-sales`,
    });
  },

  /**
   * Fetch car sales data with pagination (offset-limit strategy)
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
    sorting?: { columnKey: string; direction: 'asc' | 'desc' }[];
  }): Promise<CarSalesResponse & { hasMore: boolean }> => {
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
