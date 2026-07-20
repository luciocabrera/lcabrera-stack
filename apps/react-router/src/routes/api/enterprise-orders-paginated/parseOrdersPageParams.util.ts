import type { SortingState } from '@repo/ui/components/Table';
import type { ColumnFilter } from '@repo/ui/types/filterOperators.types';

import { toQueryFilters } from '@repo/data-access/filters/toQueryFilters.util';
import { INITIAL_PAGE_SIZE } from '@repo/ui/components/Table/Table.constants';
import { isObject } from '@repo/utils/guards/is-object.util';

import type { EnterpriseOrder } from '@/routes/enterprise-orders/config';

import { parsePositiveInteger } from '@/routes/api/filter-options/parsePositiveInteger.util';
import { toOrderQuerySort } from '@/routes/enterprise-orders/config';

import { safeJsonParse } from './safeJsonParse.util';

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
