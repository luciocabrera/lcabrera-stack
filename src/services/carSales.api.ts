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

// Use absolute URL for SSR (server-side), relative URL for client (proxied by Vite)
const getApiBaseUrl = () => {
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
  if (globalThis.window === undefined) {
    // Server-side (SSR)
    return 'http://localhost:3001/api';
  }
  // Client-side (browser)
  return '/api';
};

export const carSalesApi = {
  /**
   * Fetch car sales data
   * Returns a promise (non-blocking) to enable React streaming with Suspense
   */
  fetchCarSales: (): Promise<CarSalesResponse> => {
    const fetchData = (): Promise<CarSalesResponse> =>
      fetch(`${getApiBaseUrl()}/car-sales`).then((response) => {
        if (!response.ok) {
          throw new Error(`Failed to fetch car sales: ${response.statusText}`);
        }
        return response.json() as Promise<CarSalesResponse>;
      });

    // Add fake delay for testing skeleton/loading states
    if (FAKE_API_DELAY_MS > 0) {
      return delay(FAKE_API_DELAY_MS).then(fetchData);
    }

    return fetchData();
  },

  /**
   * Fetch car sales data with pagination (offset-limit strategy)
   * @param skip - Number of records to skip
   * @param limit - Number of records to fetch
   * @param sorting - Optional sorting configuration
   */
  fetchCarSalesPaginated: (
    skip: number,
    limit: number,
    sorting?: { columnKey: string; direction: 'asc' | 'desc' }[],
  ): Promise<CarSalesResponse & { hasMore: boolean }> => {
    const params = new URLSearchParams({
      limit: limit.toString(),
      skip: skip.toString(),
    });

    // Add sorting parameters if provided
    if (sorting && sorting.length > 0) {
      params.append('sort', JSON.stringify(sorting));
    }

    const url = `${getApiBaseUrl()}/car-sales/paginated?${params.toString()}`;
    console.warn('🌐 Fetching from URL:', url);
    
    const fetchData = () =>
      fetch(url).then(
        (response) => {
          console.warn('📡 Response status:', response.status, response.statusText);
          if (!response.ok) {
            throw new Error(`Failed to fetch car sales: ${response.statusText}`);
          }
          return response.json() as Promise<CarSalesResponse & { hasMore: boolean }>;
        },
      );

    // Add fake delay for testing skeleton/loading states
    if (FAKE_API_DELAY_MS > 0) {
      return delay(FAKE_API_DELAY_MS).then(fetchData);
    }

    return fetchData();
  },
};
