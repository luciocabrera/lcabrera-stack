import type { SortingState } from '@lcabrera/ui/components/Table';
import type { ColumnFilter } from '@lcabrera/ui/types/filterOperators.types';

import { toQueryFilters } from '@lcabrera/server/filters/to-query-filters.util';
import { INITIAL_PAGE_SIZE } from '@lcabrera/ui/components/Table/Table.constants';
import { isObject } from '@lcabrera/utils/guards/is-object.util';
import { safeJsonParse } from '@lcabrera/utils/json/safe-json-parse.util';
import { parsePositiveInteger } from '@lcabrera/utils/numbers/parse-positive-integer.util';

import type { EnterpriseOrder } from '@/routes/enterprise-orders/config';

import { toOrderQuerySort } from '@/routes/enterprise-orders/config';

export type ParsedOrdersPageParams = {
  readonly filters: ReturnType<typeof toQueryFilters>;
  readonly limit: number;
  readonly skip: number;
  readonly sort: ReturnType<typeof toOrderQuerySort>;
};

/**
 * Parse the paginated-orders resource-route search params into generic query
 * descriptor pieces. The filter/sort payloads are JSON from the table client;
 * their column identifiers are re-validated at the SQL layer (`allowedColumns`
 * + `assertSafeIdentifier`), so structural narrowing here is sufficient.
 */
export const parseOrdersPageParams = (
  params: URLSearchParams,
): ParsedOrdersPageParams => {
  const rawFilter = safeJsonParse(params.get('filter'));
  const rawSort = safeJsonParse(params.get('sort'));

  return {
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
    sort: toOrderQuerySort({
      sorting: Array.isArray(rawSort)
        ? (rawSort as SortingState<EnterpriseOrder>)
        : [],
    }),
  };
};
