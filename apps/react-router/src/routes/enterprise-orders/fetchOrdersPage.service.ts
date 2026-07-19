import type {
  ColumnFiltersState,
  SortingState,
} from '@repo/ui/components/Table';

import { buildPaginatedQueryParams } from '@repo/data-access/api';

import type { EnterpriseOrder, EnterpriseOrdersResponse } from './config';

const PAGINATED_PATH = '/_api/enterprise-orders/paginated';

export type FetchOrdersPageArgs = {
  readonly filter: ColumnFiltersState<EnterpriseOrder>;
  readonly limit: number;
  readonly skip: number;
  readonly sorting: SortingState<EnterpriseOrder>;
};

/**
 * Browser fetcher for the table's infinite-scroll load-more: calls the app's
 * own `_api/enterprise-orders/paginated` resource route (server-side Postgres
 * via `@repo/data-access`), replacing the retired api-server call.
 */
export const fetchOrdersPage = async ({
  filter,
  limit,
  skip,
  sorting,
}: FetchOrdersPageArgs): Promise<EnterpriseOrdersResponse> => {
  const params = buildPaginatedQueryParams({ filter, limit, skip, sorting });
  const response = await fetch(`${PAGINATED_PATH}?${params.toString()}`);

  if (!response.ok) {
    throw new Error(
      `Failed to load orders: ${response.status} ${response.statusText}`,
    );
  }

  return (await response.json()) as EnterpriseOrdersResponse;
};
