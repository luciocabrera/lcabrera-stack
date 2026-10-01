import { isObject } from '@lcabrera/utils/guards/is-object.util';
import { safeJsonParse } from '@lcabrera/utils/json/safe-json-parse.util';
import { parsePositiveInteger } from '@lcabrera/utils/numbers/parse-positive-integer.util';

import type { ColumnFilter } from '../filters/filters.types.ts';
import type { ColumnSort } from '../sort/sort.types.ts';
import type { TablePageParams } from './table-page.types.ts';

import { toQueryFilters } from '../filters/to-query-filters.util.ts';
import { resolveQuerySort } from '../sort/resolve-query-sort.util.ts';
import { toQuerySortRules } from './to-query-sort-rules.util.ts';

export type ParseTablePageParamsArgs = {
  /** Used when the request names no `limit`, or an unreadable one. */
  readonly defaultLimit: number;
  /** Used when the request carries no usable sort rule; must be non-empty. */
  readonly fallbackSort: readonly ColumnSort[];
  /** Columns a client may send a sort for that are not data columns. */
  readonly ignoredSortColumns?: readonly string[];
  readonly params: URLSearchParams;
};

export const parseTablePageParams = ({
  defaultLimit,
  fallbackSort,
  ignoredSortColumns,
  params,
}: ParseTablePageParamsArgs): TablePageParams => {
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
      fallback: defaultLimit,
      value: params.get('limit') ?? undefined,
    }),
    skip: parsePositiveInteger({
      fallback: 0,
      value: params.get('skip') ?? undefined,
    }),
    sort: resolveQuerySort({
      fallback: fallbackSort,
      sorting: toQuerySortRules({
        ignoredColumns: ignoredSortColumns,
        sorting: Array.isArray(rawSort) ? rawSort : [],
      }),
    }),
  };
};
