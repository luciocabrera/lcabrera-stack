import {
  buildPaginatedQueryParams,
  fakeDelay,
  getApiBaseUrl,
} from '@/utils/api';
import { createLogger } from '@/utils/logger';

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

const isObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

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
    const fetchData = async (): Promise<CarSalesResponse> => {
      const response = await fetch(`${getApiBaseUrl(requestUrl)}/car-sales`);

      if (!response.ok) {
        throw new Error(`Failed to fetch car sales: ${response.statusText}`);
      }

      const body = (await response.json()) as unknown;
      if (!isCarSalesResponse(body)) {
        throw new Error('Unexpected response shape from /car-sales');
      }
      return body;
    };

    await fakeDelay();

    return fetchData();
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

    const fetchData = async (): Promise<
      CarSalesResponse & { hasMore: boolean }
    > => {
      const response = await fetch(url);

      log.debug('📡 Response status:', response.status, response.statusText);
      if (!response.ok) {
        throw new Error(`Failed to fetch car sales: ${response.statusText}`);
      }

      const body = (await response.json()) as unknown;
      if (!isCarSalesPaginatedResponse(body)) {
        throw new Error('Unexpected response shape from /car-sales/paginated');
      }
      return body;
    };

    await fakeDelay();

    return fetchData();
  },
};
