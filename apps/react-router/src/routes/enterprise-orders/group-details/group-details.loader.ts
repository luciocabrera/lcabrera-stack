import type { LoaderFunctionArgs } from 'react-router';

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
import { toOrderGroupHeading } from '../.server/toOrderGroupHeading.util';
import {
  COLUMNS,
  GROUP_DETAILS_PERSISTENCE_KEY,
  SCHEMA_NAME,
  TABLE_NAME,
  TITLE,
} from '../EnterpriseOrders.constants';

/**
 * The rows underneath one group row, as an ordinary paginated table (ADR-087).
 *
 * It inherits the list's `filters` and `sorting` as its floor and writes none of
 * them back — `isUrlStateReadOnly` keeps its own adjustments in the store, so
 * the modal cannot overwrite the URL of the list underneath it. It declares no
 * grouping (a grouped read would return group rows again) and no keyset (the
 * translation rewrites the sort a cursor would have to match).
 */
const tableLoader = createTableRouteLoader<
  EnterpriseOrderTableRow,
  EnterpriseOrdersResponse
>({
  appId: APP_ID,
  columns: COLUMNS,
  fetchPage: async ({ effectiveSorting, filters, request }) => {
    const resolved = await resolveOrdersGroupRead({
      filters: toQueryFilters({ filters }),
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
    isServerFilterEnabled: true,
    isUrlStateReadOnly: true,
  },
  persistenceKey: GROUP_DETAILS_PERSISTENCE_KEY,
  schemaName: SCHEMA_NAME,
  tableName: TABLE_NAME,
  title: TITLE,
});

/**
 * Wrapped rather than folded in: `createTableRouteLoader` returns the table's
 * serializable slices and nothing route-specific, and `useTableRoutePage` reads
 * only the slices it knows, so the heading rides along untouched.
 */
export const loader = async (args: LoaderFunctionArgs) => ({
  ...(await tableLoader(args)),
  groupHeading: toOrderGroupHeading({
    columns: COLUMNS,
    params: new URL(args.request.url).searchParams,
  }),
});
