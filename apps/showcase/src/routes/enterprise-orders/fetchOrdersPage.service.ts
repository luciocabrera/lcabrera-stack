import { createPaginatedFetcher } from '@lcabrera/api/http/create-paginated-fetcher.util';

import type { EnterpriseOrdersResponse } from './config';

import { isEnterpriseOrdersResponse } from './config';

export const fetchOrdersPage = createPaginatedFetcher<EnterpriseOrdersResponse>(
  {
    isValid: isEnterpriseOrdersResponse,
    path: '/_api/enterprise-orders/paginated',
  },
);
