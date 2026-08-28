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
import { resolveOrdersGroupRestriction } from '../.server/resolveOrdersGroupRestriction.util';
import {
  COLUMNS,
  GROUP_DETAILS_PERSISTENCE_KEY,
  SCHEMA_NAME,
  TABLE_NAME,
  TITLE,
} from '../EnterpriseOrders.constants';

export const loader = createTableRouteLoader<
  EnterpriseOrderTableRow,
  EnterpriseOrdersResponse
>({
  appId: APP_ID,
  columns: COLUMNS,
  fetchPage: async ({ effectiveSorting, filters, request }) => {
    const resolved = await resolveOrdersGroupRead({
      filters: toQueryFilters({ filters }),
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
    isColumnLayoutTransient: true,
    isServerFilterEnabled: true,
    isUrlStateNested: true,
  },
  persistenceKey: GROUP_DETAILS_PERSISTENCE_KEY,
  resolveLockedFilters: ({ request }) =>
    resolveOrdersGroupRestriction({
      columns: COLUMNS,
      isGroupRequired: true,
      params: new URL(request.url).searchParams,
    }),
  schemaName: SCHEMA_NAME,
  tableName: TABLE_NAME,
  title: TITLE,
});
