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
import { ENTERPRISE_ORDERS_GROUP_PATH } from './config';
import {
  COLUMNS,
  CRUD,
  DELETE_ACTION_PATH,
  PERSISTENCE_KEY,
  SCHEMA_NAME,
  TABLE_NAME,
  TITLE,
} from './EnterpriseOrders.constants';

export const loader = createTableRouteLoader<
  EnterpriseOrderTableRow,
  EnterpriseOrdersResponse
>({
  appId: APP_ID,
  columns: COLUMNS,
  fetchPage: ({ effectiveSorting, filters, grouping, totalsPlacement }) =>
    selectOrdersPage({
      filters: toQueryFilters({ filters }),
      grouping,
      includeTotal: true,
      limit: INITIAL_PAGE_SIZE,
      offset: 0,
      sort: toQuerySort({ sorting: effectiveSorting }),
      totalsPlacement,
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
    groupDetailsPath: ENTERPRISE_ORDERS_GROUP_PATH,
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
