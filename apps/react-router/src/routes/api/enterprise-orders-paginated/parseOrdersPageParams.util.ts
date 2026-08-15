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
 * Parse the paginated-orders resource-route search params into generic query
 * descriptor pieces. The filter/sort payloads are JSON from the table client;
 * their column identifiers are re-validated at the SQL layer (`allowedColumns`
 * + `assertSafeIdentifier`), so structural narrowing here is sufficient.
 *
 * `cursor` is a tuple of **values**, never identifiers — it is parameterized
 * into the query and never reaches the SQL text. Whether it describes a total
 * order the page can actually seek along is `toOrderKeysetCursor`'s call.
 *
 * `sort` is resolved against a fallback rather than passed through, so this
 * route's ordering is its own guarantee instead of a borrowed one. The Table
 * client always sends a sort — `buildTablePageQuery` appends the primary key —
 * but this is a public URL, and a caller that is not that client would otherwise
 * get a paginated read with no ORDER BY, which repeats and skips rows.
 *
 * **`limit` and the sort length are bounded — deliberately not here** (#706).
 * The sibling parsers clamp `limit` themselves; this route's SSR loader reads
 * the same table through `selectOrdersPage` **without** passing through this
 * function, so a clamp here would bound one of the two entry points and would
 * have to be repeated — in two places free to drift — to bound the other. Both
 * bounds live in `selectOrdersPage` instead, which every entry point does
 * reach: `MAX_ENTERPRISE_ORDERS_LIMIT` and `MAX_ENTERPRISE_ORDERS_SORT_RULES`.
 * What this returns is what the request asked for.
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
