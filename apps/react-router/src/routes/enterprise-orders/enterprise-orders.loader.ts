import { toQueryFilters } from '@lcabrera/server/filters/to-query-filters.util';
import { INITIAL_PAGE_SIZE } from '@lcabrera/ui/components/Table/Table.constants';
import { createTableRouteLoader } from '@lcabrera/ui/routing/loaders/createTableRouteLoader.util';
import { toQuerySort } from '@lcabrera/ui/routing/shared/toQuerySort.util';

import { APP_ID } from '@/constants/app.constants';

import type {
  EnterpriseOrderListRow,
  EnterpriseOrdersResponse,
} from './config';

import { selectOrdersPage } from './.server/enterpriseOrders.service';
import {
  COLUMNS,
  CRUD,
  DELETE_ACTION_PATH,
  PERSISTENCE_KEY,
  SCHEMA_NAME,
  TABLE_NAME,
  TITLE,
} from './EnterpriseOrders.constants';

/**
 * Loader for the enterprise orders route.
 *
 * `filterOptions.transport` is `loader` (not `bff`): filter options fetch
 * same-origin through the `/_api/filter-options` resource route, which calls
 * the distinct endpoint server-side — the same same-origin model the rows use.
 * `bff` fetches the API host directly from the browser, which only works behind
 * a proxy and fails CORS under a bare `react-router-serve` prod build (#340).
 *
 * The fetch reads Postgres server-side via the `.server` executor — no
 * api-server round-trip — and returns the promise unawaited for Suspense
 * streaming.
 */
export const loader = createTableRouteLoader<
  EnterpriseOrderListRow,
  EnterpriseOrdersResponse
>({
  appId: APP_ID,
  columns: COLUMNS,
  fetchPage: ({ effectiveSorting, filters }) =>
    selectOrdersPage({
      filters: toQueryFilters({ filters }),
      // The first page of a scroll session, so this is the one read that counts
      // the filtered set; every load-more after it reuses this total (#402).
      includeTotal: true,
      limit: INITIAL_PAGE_SIZE,
      offset: 0,
      sort: toQuerySort({ sorting: effectiveSorting }),
    }),
  filterOptions: { transport: 'loader' },
  // This route's endpoint is the only one that both filters server-side and
  // seeks, so it is the only one declaring either capability (ADR-063). The
  // flags travel with the loader data, so the `filters` forwarded above and the
  // load-more query the table builds read one declaration rather than two.
  meta: {
    crud: CRUD,
    deleteActionPath: DELETE_ACTION_PATH,
    isKeysetEnabled: true,
    isServerFilterEnabled: true,
  },
  persistenceKey: PERSISTENCE_KEY,
  schemaName: SCHEMA_NAME,
  tableName: TABLE_NAME,
  title: TITLE,
});
