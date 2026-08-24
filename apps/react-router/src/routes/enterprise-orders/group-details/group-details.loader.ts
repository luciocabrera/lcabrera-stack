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
 * Loader for the group-details modal: the rows underneath one group row, as an
 * ordinary paginated table (#870).
 *
 * **It reads the list's URL state and writes none of it back.** The `filters`
 * and `sorting` params belong to the grouped list underneath, and this route
 * inherits them as its floor — a group row was computed under those filters, so
 * a read that dropped them would open on a larger set than the count the reader
 * clicked. `isUrlStateReadOnly` is what stops the modal's own filter drawer
 * writing over them; its adjustments live in the store for the life of the
 * dialog. The group itself is in `group`, which is this route's own param and
 * therefore survives a refresh.
 *
 * **It declares no grouping**, so the list's `grouping` param is not read here
 * at all: this is the ungrouped read of one group's rows, and a grouped one
 * would return group rows again.
 *
 * **It declares no keyset**, deliberately. A cursor is a tuple matching the
 * sort the rows came back under, and `toDrillRead` rewrites that sort — it
 * drops the group-key and measure terms and appends the primary key — so a
 * cursor built from the table's own sorting would not line up with it. One
 * group is bounded, so offset paging costs little and cannot skew.
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
      ? { data: [], error: resolved.error, hasMore: false, total: 0 }
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
 * The table loader plus the modal's own heading.
 *
 * Wrapped rather than folded in: `createTableRouteLoader` returns the table's
 * three serializable slices and nothing route-specific, and the heading is this
 * route's alone. `useTableRoutePage` reads only the slices it knows, so the
 * extra field rides along untouched.
 */
export const loader = async (args: LoaderFunctionArgs) => ({
  ...(await tableLoader(args)),
  groupHeading: toOrderGroupHeading({
    columns: COLUMNS,
    params: new URL(args.request.url).searchParams,
  }),
});
