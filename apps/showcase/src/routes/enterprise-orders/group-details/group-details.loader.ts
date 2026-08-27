import { toQueryFilters } from '@lcabrera/server/filters/to-query-filters.util';
import { INITIAL_PAGE_SIZE } from '@lcabrera/ui/components/Table/Table.constants';
import { createTableRouteLoader } from '@lcabrera/ui/routing/loaders/createTableRouteLoader.util';
import { toQuerySort } from '@lcabrera/ui/routing/shared/toQuerySort.util';

import { APP_ID } from '@/constants/app.constants';

import type {
  EnterpriseOrdersResponse,
  EnterpriseOrderTableRow,
} from '../config';

import { selectOrdersPage } from '../.server/enterpriseOrders.service';
import { resolveOrdersGroupRead } from '../.server/resolveOrdersGroupRead.util';
import { toOrderGroupLockedFilters } from '../.server/toOrderGroupLockedFilters.util';
import {
  COLUMNS,
  GROUP_DETAILS_PERSISTENCE_KEY,
  SCHEMA_NAME,
  TABLE_NAME,
  TITLE,
} from '../EnterpriseOrders.constants';

/**
 * The rows underneath one group row, as an ordinary paginated table (ADR-087).
 * `isUrlStateNested` puts its own `filters` and `sorting` under a prefix, so it shares the
 * list's URL without re-filtering the list underneath it; the link seeds those from the
 * list's, which is the floor the group was computed under.
 */
export const loader = createTableRouteLoader<
  EnterpriseOrderTableRow,
  EnterpriseOrdersResponse
>({
  appId: APP_ID,
  columns: COLUMNS,
  fetchPage: async ({ effectiveSorting, filters, request }) => {
    const resolved = await resolveOrdersGroupRead({
      filters: toQueryFilters({ filters }),
      // This route serves one group and nothing else, so a request with no
      // token is refused rather than read as the whole table.
      isGroupRequired: true,
      limit: INITIAL_PAGE_SIZE,
      params: new URL(request.url).searchParams,
      skip: 0,
      sort: toQuerySort({ sorting: effectiveSorting }),
    });

    return resolved.kind === 'refused'
      ? {
          data: [],
          error: { kind: 'unexpected', message: resolved.message },
          hasMore: false,
          total: 0,
        }
      : selectOrdersPage(resolved.read);
  },
  filterOptions: { transport: 'loader' },
  meta: {
    // A drill is a look at one group's rows, not a view a reader keeps: it opens
    // at the columns COLUMNS declares, in that order, every time. Without this
    // the layout comes out of the modal's own cookie, so an order shaped on some
    // earlier, unrelated drill decides what this one shows first. Column sizing
    // goes with it — the cookie carries the layout whole.
    isColumnLayoutTransient: true,
    isServerFilterEnabled: true,
    isUrlStateNested: true,
  },
  persistenceKey: GROUP_DETAILS_PERSISTENCE_KEY,
  resolveLockedFilters: ({ request }) =>
    toOrderGroupLockedFilters({
      columns: COLUMNS,
      params: new URL(request.url).searchParams,
    }),
  schemaName: SCHEMA_NAME,
  tableName: TABLE_NAME,
  title: TITLE,
});
