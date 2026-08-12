import { toQueryFilters } from '@lcabrera/server/filters/to-query-filters.util';
import { INITIAL_PAGE_SIZE } from '@lcabrera/ui/components/Table/Table.constants';
import { createTableRouteLoader } from '@lcabrera/ui/routing/loaders/createTableRouteLoader.util';
import { toQuerySort } from '@lcabrera/ui/routing/shared/toQuerySort.util';

import { APP_ID } from '@/constants/app.constants';

import type {
  EnterpriseOrdersResponse,
  EnterpriseOrderTableRow,
} from './config';

import {
  selectOrderGroupingCapabilities,
  selectOrdersPage,
} from './.server/enterpriseOrders.service';
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
  EnterpriseOrderTableRow,
  EnterpriseOrdersResponse
>({
  appId: APP_ID,
  columns: COLUMNS,
  fetchPage: ({ effectiveSorting, filters, grouping }) =>
    selectOrdersPage({
      filters: toQueryFilters({ filters }),
      // Already sanitized against this route's columns, and empty unless the
      // capability below is declared — so this is a forward, not a decision.
      grouping,
      // The first page of a scroll session, so this is the one read that counts
      // the filtered set; every load-more after it reuses this total (#402).
      includeTotal: true,
      limit: INITIAL_PAGE_SIZE,
      offset: 0,
      sort: toQuerySort({ sorting: effectiveSorting }),
    }),
  filterOptions: { transport: 'loader' },
  // This endpoint filters server-side, seeks, and groups, so it declares all
  // three capabilities (ADR-063); they travel with the loader data for the
  // table's load-more and header menu to read. The `filters` forwarded above is
  // separate and unconditional — nothing gates the first page on that flag, so
  // setting `isServerFilterEnabled: false` here would stop later pages
  // filtering while the first page still did. `isGroupingEnabled` is not like
  // that: it is what makes the loader read the `grouping` param at all, so
  // removing it switches grouping off end to end.
  meta: {
    crud: CRUD,
    deleteActionPath: DELETE_ACTION_PATH,
    isGroupingEnabled: true,
    isKeysetEnabled: true,
    isServerFilterEnabled: true,
  },
  persistenceKey: PERSISTENCE_KEY,
  // What each column may do in a grouped read, from the pg catalogue (ADR-058),
  // shipped to the client so the aggregate menu is built from the column's real
  // Postgres type rather than from its declared `dataType` (#550). One extra
  // catalogue query per page load here, run concurrently with the data query.
  resolveGroupingCapabilities: selectOrderGroupingCapabilities,
  schemaName: SCHEMA_NAME,
  tableName: TABLE_NAME,
  title: TITLE,
});
