import { getApiBaseUrl } from '@/utils/api';

/**
 * Enterprise Orders API Service
 * Handles database queries for enterprise orders data
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

export type EnterpriseOrder = {
  balance_due: string;
  billing_address_line1: string;
  billing_city: string;
  billing_country: string;
  billing_postal_code: string;
  billing_state: string;
  carrier: string;
  created_at: string;
  customer_email: string;
  customer_id: number;
  customer_name: string;
  customer_phone: string;
  customer_rating: null | number;
  customer_since: string;
  customer_type: string;
  delivery_date: null | string;
  discount_amount: string;
  discount_percentage: string;
  estimated_delivery_days: number;
  internal_notes: null | string;
  is_fragile: boolean;
  is_gift: boolean;
  is_rush_order: boolean;
  is_vip_customer: boolean;
  last_modified_by: string;
  loyalty_points: number;
  order_date: string;
  order_id: number;
  order_notes: null | string;
  order_number: string;
  order_status: string;
  order_timestamp: string;
  paid_amount: string;
  payment_date: null | string;
  payment_method: string;
  payment_reference: null | string;
  payment_status: string;
  priority: string;
  product_category: string;
  product_subcategory: string;
  quantity: number;
  requires_signature: boolean;
  shipped_date: null | string;
  shipping_address_line1: string;
  shipping_address_line2: null | string;
  shipping_city: string;
  shipping_cost: string;
  shipping_country: string;
  shipping_postal_code: string;
  shipping_state: string;
  subtotal: string;
  tax_amount: string;
  total_amount: string;
  tracking_number: null | string;
  unit_price: string;
  updated_at: string;
  volume_m3: string;
  warehouse_location: string;
  weight_kg: string;
};

export type EnterpriseOrdersResponse = {
  data: EnterpriseOrder[];
  total: number;
};

export type FetchEnterpriseOrdersParams = {
  filter?: Record<string, unknown>;
  limit: number;
  requestUrl?: string;
  skip: number;
  sorting?: { columnKey: string; direction: 'asc' | 'desc' }[];
};

/**
 * Enterprise Orders API
 */
export const enterpriseOrdersApi = {
  /**
   * Fetch distinct values for a column (for dynamic filter options)
   */
  fetchDistinctValues: async ({
    columnName,
    limit = 50,
    offset = 0,
    requestUrl,
  }: {
    columnName: string;
    limit?: number;
    offset?: number;
    requestUrl?: string;
  }): Promise<{ hasMore: boolean; values: string[] }> => {
    const url = `${getApiBaseUrl(requestUrl)}/enterprise-orders/distinct/${columnName}?limit=${limit}&offset=${offset}`;
    console.warn(
      '🎯 [Orders] Fetching distinct values for:',
      columnName,
      'offset:',
      offset,
    );

    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(
        `API request failed: ${response.status} ${response.statusText}`,
      );
    }

    return response.json() as Promise<{ hasMore: boolean; values: string[] }>;
  },

  /**
   * Fetch enterprise orders data with pagination (offset-limit strategy)
   */
  fetchEnterpriseOrdersPaginated: ({
    filter,
    limit,
    requestUrl,
    skip,
    sorting,
  }: FetchEnterpriseOrdersParams): Promise<
    EnterpriseOrdersResponse & { hasMore: boolean }
  > => {
    const params = new URLSearchParams({
      limit: limit.toString(),
      skip: skip.toString(),
    });

    // Add sorting parameters if provided
    if (sorting && sorting.length > 0) {
      params.append('sort', JSON.stringify(sorting));
    }

    // Add filter parameters if provided
    if (filter && Object.keys(filter).length > 0) {
      params.append('filter', JSON.stringify(filter));
    }

    const url = `${getApiBaseUrl(requestUrl)}/enterprise-orders/paginated?${params.toString()}`;
    console.warn('🌐 [Orders] Fetching from URL:', url);
    console.warn('🌐 [Orders] Filter object:', filter);
    console.warn('🌐 [Orders] Sorting:', sorting);

    const fetchData = () =>
      fetch(url).then((response) => {
        console.warn(
          '📡 [Orders] Response status:',
          response.status,
          response.statusText,
        );

        if (!response.ok) {
          throw new Error(
            `API request failed: ${response.status} ${response.statusText}`,
          );
        }

        return response.json() as Promise<
          EnterpriseOrdersResponse & { hasMore: boolean }
        >;
      });

    // Add artificial delay if configured (for testing loading states)
    if (FAKE_API_DELAY_MS > 0) {
      console.warn(`⏱️  [Orders] Delaying response by ${FAKE_API_DELAY_MS}ms`);
      return delay(FAKE_API_DELAY_MS).then(fetchData);
    }

    return fetchData();
  },
};
