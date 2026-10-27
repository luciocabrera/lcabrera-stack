import { createPaginatedFetcher } from '@lcabrera/api/http/create-paginated-fetcher.util';
import { isTablePageResponse } from '@lcabrera/api/table-page/is-table-page-response.util';

import type { EnterpriseOrdersResponse } from './config';

import { ENTERPRISE_ORDERS_PAGE_PATH } from './config';

export const fetchOrdersPage = createPaginatedFetcher<EnterpriseOrdersResponse>(
  {
    isValid: isTablePageResponse<EnterpriseOrdersResponse>,
    path: ENTERPRISE_ORDERS_PAGE_PATH,
  },
);
