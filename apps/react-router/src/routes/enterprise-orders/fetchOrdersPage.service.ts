import { createPaginatedFetcher } from '@lcabrera/api/http/create-paginated-fetcher.util';

import type { EnterpriseOrdersResponse } from './config';

import { isEnterpriseOrdersResponse } from './config';

/**
 * Browser fetcher for the table's infinite-scroll load-more. It calls the app's
 * own `_api/enterprise-orders/paginated` resource route, which reads Postgres
 * server-side via `@lcabrera/server` — same-origin, so there is no base URL to
 * resolve.
 */
export const fetchOrdersPage = createPaginatedFetcher<EnterpriseOrdersResponse>(
  {
    isValid: isEnterpriseOrdersResponse,
    path: '/_api/enterprise-orders/paginated',
  },
);
