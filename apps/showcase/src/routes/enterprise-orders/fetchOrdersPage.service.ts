import { createPaginatedFetcher } from '@lcabrera/api/http/create-paginated-fetcher.util';
import { isTablePageResponse } from '@lcabrera/api/table-page/is-table-page-response.util';

import type { EnterpriseOrdersResponse } from './config';

export const fetchOrdersPage = createPaginatedFetcher<EnterpriseOrdersResponse>(
  {
    isValid: isTablePageResponse<EnterpriseOrdersResponse>,
    path: '/_api/enterprise-orders/paginated',
  },
);
