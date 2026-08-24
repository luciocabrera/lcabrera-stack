import type { QuerySort } from '@lcabrera/server/db/query-builder/query-builder.types';
import type { SortingState } from '@lcabrera/ui/components/Table';
import type { ColumnFilter } from '@lcabrera/ui/types/filterOperators.types';

import { toQueryFilters } from '@lcabrera/server/filters/to-query-filters.util';
import { resolveQuerySort } from '@lcabrera/server/sort/resolve-query-sort.util';
import { INITIAL_PAGE_SIZE } from '@lcabrera/ui/components/Table/Table.constants';
import { sanitizeSorting } from '@lcabrera/ui/routing/shared/sanitizeSorting.util';
import { isObject } from '@lcabrera/utils/guards/is-object.util';
import { safeJsonParse } from '@lcabrera/utils/json/safe-json-parse.util';
import { parsePositiveInteger } from '@lcabrera/utils/numbers/parse-positive-integer.util';

import type { EnterpriseOrderListRow } from '@/routes/enterprise-orders/config';

import { ENTERPRISE_ORDER_FALLBACK_SORT } from '@/routes/enterprise-orders/config';

export type ParsedOrdersPageParams = {
  readonly cursor?: readonly unknown[];
  readonly filters: ReturnType<typeof toQueryFilters>;
  readonly limit: number;
  readonly skip: number;
  readonly sort: readonly QuerySort[];
};

/**
 * The paginated-orders search params as generic query descriptor pieces, for
 * both `/paginated` and the group-details route (ADR-087).
 *
 * `limit` and the sort length are bounded in `selectOrdersPage`, not here: the
 * SSR loader reads the same table without passing through this function, so a
 * clamp here would bound one entry point and have to be repeated for the other
 * (#706). What this returns is what the request asked for.
 *
 * `sort` resolves against a fallback because this is a public URL: a caller that
 * is not the table client would otherwise get a paginated read with no ORDER BY,
 * which repeats and skips rows.
 */
export const parseOrdersPageParams = (
  params: URLSearchParams,
): ParsedOrdersPageParams => {
  const rawCursor = safeJsonParse(params.get('cursor'));
  const rawFilter = safeJsonParse(params.get('filter'));
  const rawSort = safeJsonParse(params.get('sort'));

  return {
    ...(Array.isArray(rawCursor) && { cursor: rawCursor }),
    filters: toQueryFilters({
      filters: isObject(rawFilter)
        ? (rawFilter as Readonly<Record<string, ColumnFilter>>)
        : {},
    }),
    limit: parsePositiveInteger({
      fallback: INITIAL_PAGE_SIZE,
      value: params.get('limit') ?? undefined,
    }),
    skip: parsePositiveInteger({
      fallback: 0,
      value: params.get('skip') ?? undefined,
    }),
    sort: resolveQuerySort({
      fallback: ENTERPRISE_ORDER_FALLBACK_SORT,
      sorting: sanitizeSorting<EnterpriseOrderListRow>(
        Array.isArray(rawSort)
          ? (rawSort as SortingState<EnterpriseOrderListRow>)
          : [],
      ),
    }),
  };
};
