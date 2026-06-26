import { getApiBaseUrl } from '@/utils/api';
import { createLogger } from '@/utils/logger';

const log = createLogger({ prefix: '[carSales]' });

/**
 * Car Sales API Service
 * Handles database queries for car sales data
 */

/**
 * Simulated API delay in milliseconds for testing loading states.
 * Configurable via VITE_API_DELAY_MS environment variable.
 * Set to 0 for production or to disable delay.
 */
const FAKE_API_DELAY_MS = Number(import.meta.env.VITE_API_DELAY_MS) || 0;

/**
 * Helper to add artificial delay for testing loading states
 */
const delay = (ms: number): Promise<void> =>
  new Promise((resolve) => {
    setTimeout(resolve, ms);
  });

export type CarSale = {
  buyer_address: string;
  buyer_email: string;
  buyer_name: string;
  buyer_phone: string;
  car_id: number;
  city: null | string;
  color: string;
  country: null | string;
  date_of_ingress: string;
  date_of_sale: string;
  engine: string;
  fuel_type: string;
  insurance_expiration_date: string;
  insurance_policy_number: string;
  insurance_provider: string;
  loan_amount: number;
  loan_provider: string;
  mileage: number;
  model: string;
  postal_code: null | string;
  profit: number;
  purchase_price: number;
  sale_price: number;
  seller_address: string;
  seller_email: string;
  seller_name: string;
  seller_phone: string;
  state: null | string;
  transmission: string;
  year: number;
};

export type CarSalesResponse = {
  data: CarSale[];
  total: number;
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

    // Add fake delay for testing skeleton/loading states
    if (FAKE_API_DELAY_MS > 0) {
      await delay(FAKE_API_DELAY_MS);
    }

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
    const params = new URLSearchParams({
      limit: limit.toString(),
      skip: skip.toString(),
    });

    // Add sorting parameters if provided
    if (sorting && sorting.length > 0) {
      params.append('sort', JSON.stringify(sorting));
    }

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

    // Add fake delay for testing skeleton/loading states
    if (FAKE_API_DELAY_MS > 0) {
      await delay(FAKE_API_DELAY_MS);
    }

    return fetchData();
  },
};
