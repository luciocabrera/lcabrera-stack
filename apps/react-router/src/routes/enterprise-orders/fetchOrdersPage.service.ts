import type {
  ColumnFiltersState,
  SortingState,
} from '@lcabrera/ui/components/Table';

import { buildPaginatedQueryParams } from '@lcabrera/api/http/build-paginated-query-params.util';

import type {
  EnterpriseOrderListRow,
  EnterpriseOrdersResponse,
} from './config';

const PAGINATED_PATH = '/_api/enterprise-orders/paginated';

export type FetchOrdersPageArgs = {
  /** Sort-key tuple of the last loaded row, for a keyset seek (ADR-052). */
  readonly cursor?: readonly unknown[];
  readonly filter: ColumnFiltersState<EnterpriseOrderListRow>;
  readonly limit: number;
  readonly skip: number;
  readonly sorting: SortingState<EnterpriseOrderListRow>;
};

/**
 * Browser fetcher for the table's infinite-scroll load-more: calls the app's
 * own `_api/enterprise-orders/paginated` resource route (server-side Postgres
 * via `@lcabrera/server`), replacing the retired api-server call.
 */
export const fetchOrdersPage = async ({
  cursor,
  filter,
  limit,
  skip,
  sorting,
}: FetchOrdersPageArgs): Promise<EnterpriseOrdersResponse> => {
  const params = buildPaginatedQueryParams({
    cursor,
    filter,
    limit,
    skip,
    sorting,
  });
  const response = await fetch(`${PAGINATED_PATH}?${params.toString()}`);

  if (!response.ok) {
    throw new Error(
      `Failed to load orders: ${response.status} ${response.statusText}`,
    );
  }

  return (await response.json()) as EnterpriseOrdersResponse;
};
