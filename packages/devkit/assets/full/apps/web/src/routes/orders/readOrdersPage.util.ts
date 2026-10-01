/**
 * The page contract the route reads through after its first page, with the
 * signature the rung below declared: the same query in, a page out. Each page
 * is answered by the resource route at `PAGE_PATH`, so the sort, the filters,
 * the keyset cursor and a drill-down group all reach the database.
 */

import { createPaginatedFetcher } from '@lcabrera/api/http/create-paginated-fetcher.util';
import { isTablePageResponse } from '@lcabrera/api/table-page/is-table-page-response.util';

import type { OrdersPage } from './orders.types';

import { PAGE_PATH } from './Orders.constants';

export const readOrdersPage = createPaginatedFetcher<OrdersPage>({
  isValid: isTablePageResponse<OrdersPage>,
  path: PAGE_PATH,
});
