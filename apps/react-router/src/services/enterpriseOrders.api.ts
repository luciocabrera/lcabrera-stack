import type {
  ColumnFiltersState,
  SortingState,
} from '@repo/ui/components/Table';

import {
  buildPaginatedQueryParams,
  fakeDelay,
  fetchAndValidate,
  getApiBaseUrl,
} from '@repo/data-access/api';
import { createLogger } from '@repo/ui/utils/logger';
import { isObject } from '@repo/ui/utils/typeGuards';

const log = createLogger({ prefix: '[orders]' });

/**
 * Enterprise Orders API Service
 * Handles database queries for enterprise orders data
 */

export type EnterpriseOrder = {
  readonly balance_due: string;
  readonly billing_address_line1: string;
  readonly billing_city: string;
  readonly billing_country: string;
  readonly billing_postal_code: string;
  readonly billing_state: string;
  readonly carrier: string;
  readonly created_at: string;
  readonly customer_email: string;
  readonly customer_id: number;
  readonly customer_name: string;
  readonly customer_phone: string;
  readonly customer_rating: null | number;
  readonly customer_since: string;
  readonly customer_type: string;
  readonly delivery_date: null | string;
  readonly discount_amount: string;
  readonly discount_percentage: string;
  readonly estimated_delivery_days: number;
  readonly internal_notes: null | string;
  readonly is_fragile: boolean;
  readonly is_gift: boolean;
  readonly is_rush_order: boolean;
  readonly is_vip_customer: boolean;
  readonly last_modified_by: string;
  readonly loyalty_points: number;
  readonly order_date: string;
  readonly order_id: number;
  readonly order_notes: null | string;
  readonly order_number: string;
  readonly order_status: string;
  readonly order_timestamp: string;
  readonly paid_amount: string;
  readonly payment_date: null | string;
  readonly payment_method: string;
  readonly payment_reference: null | string;
  readonly payment_status: string;
  readonly priority: string;
  readonly product_category: string;
  readonly product_subcategory: string;
  readonly quantity: number;
  readonly requires_signature: boolean;
  readonly shipped_date: null | string;
  readonly shipping_address_line1: string;
  readonly shipping_address_line2: null | string;
  readonly shipping_city: string;
  readonly shipping_cost: string;
  readonly shipping_country: string;
  readonly shipping_postal_code: string;
  readonly shipping_state: string;
  readonly subtotal: string;
  readonly tax_amount: string;
  readonly total_amount: string;
  readonly tracking_number: null | string;
  readonly unit_price: string;
  readonly updated_at: string;
  readonly volume_m3: string;
  readonly warehouse_location: string;
  readonly weight_kg: string;
};

export type EnterpriseOrdersResponse = {
  readonly data: readonly EnterpriseOrder[];
  readonly hasMore?: boolean;
  readonly total: number;
};

type EnterpriseOrderDetailResponse = {
  readonly data: EnterpriseOrder;
};

const isDistinctValuesResponse = (
  value: unknown,
): value is { hasMore: boolean; values: string[] } =>
  isObject(value) &&
  typeof value['hasMore'] === 'boolean' &&
  Array.isArray(value['values']);

const isEnterpriseOrderDetailResponse = (
  value: unknown,
): value is EnterpriseOrderDetailResponse =>
  isObject(value) && isObject(value['data']);

const isEnterpriseOrdersResponse = (
  value: unknown,
): value is EnterpriseOrdersResponse & { hasMore: boolean } =>
  isObject(value) &&
  Array.isArray(value['data']) &&
  typeof value['total'] === 'number' &&
  typeof value['hasMore'] === 'boolean';

type FetchEnterpriseOrdersParams = {
  readonly filter?: ColumnFiltersState<EnterpriseOrder>;
  readonly limit: number;
  readonly requestUrl?: string;
  readonly skip: number;
  readonly sorting?: SortingState<EnterpriseOrder>;
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
    columnName: keyof EnterpriseOrder;
    limit?: number;
    offset?: number;
    requestUrl?: string;
  }): Promise<{ hasMore: boolean; values: string[] }> => {
    const url = `${getApiBaseUrl(requestUrl)}/enterprise-orders/distinct/${columnName}?limit=${limit}&offset=${offset}`;
    log.debug(
      '🎯 Fetching distinct values for:',
      columnName,
      'offset:',
      offset,
    );

    return fetchAndValidate({
      isValid: isDistinctValuesResponse,
      shapeErrorMessage: `Unexpected response shape from /enterprise-orders/distinct/${columnName}`,
      url,
    });
  },

  /**
   * Fetch a single enterprise order by ID
   */
  fetchEnterpriseOrderById: async ({
    orderId,
    requestUrl,
  }: {
    orderId: number;
    requestUrl?: string;
  }): Promise<EnterpriseOrderDetailResponse> => {
    const url = `${getApiBaseUrl(requestUrl)}/enterprise-orders/${orderId}`;
    log.debug('🎯 Fetching order by ID:', orderId);

    return fetchAndValidate({
      isValid: isEnterpriseOrderDetailResponse,
      shapeErrorMessage: `Unexpected response shape from /enterprise-orders/${orderId}`,
      url,
    });
  },

  /**
   * Fetch enterprise orders data with pagination (offset-limit strategy)
   */
  fetchEnterpriseOrdersPaginated: async ({
    filter,
    limit,
    requestUrl,
    skip,
    sorting,
  }: FetchEnterpriseOrdersParams): Promise<
    EnterpriseOrdersResponse & { hasMore: boolean }
  > => {
    const params = buildPaginatedQueryParams({ filter, limit, skip, sorting });

    const url = `${getApiBaseUrl(requestUrl)}/enterprise-orders/paginated?${params.toString()}`;
    log.debug('🌐 Fetching from URL:', url);
    log.debug('🌐 Filter object:', filter);
    log.debug('🌐 Sorting:', sorting);

    const fetchData = async (): Promise<
      EnterpriseOrdersResponse & { hasMore: boolean }
    > => {
      const response = await fetch(url);
      log.debug('📡 Response status:', response.status, response.statusText);

      if (!response.ok) {
        throw new Error(
          `API request failed: ${response.status} ${response.statusText}`,
        );
      }

      const body = (await response.json()) as unknown;
      if (!isEnterpriseOrdersResponse(body)) {
        throw new Error(
          'Unexpected response shape from /enterprise-orders/paginated',
        );
      }
      return body;
    };

    // Add artificial delay if configured (for testing loading states)
    await fakeDelay();

    return fetchData();
  },
};
