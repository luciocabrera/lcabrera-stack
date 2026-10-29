import type { ColumnFiltersRefusal } from '@lcabrera/api/filters/filters.types';

import { parseColumnFilters } from '@lcabrera/api/filters/parse-column-filters.util';
import { safeJsonParse } from '@lcabrera/utils/json/safe-json-parse.util';
import { parsePositiveInteger } from '@lcabrera/utils/numbers/parse-positive-integer.util';

import type { ColumnSort } from '../sort/sort.types.ts';
import type { TablePageParamsResolution } from './table-page.types.ts';

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

const FILTER_REFUSAL_MESSAGE: Readonly<
  Record<ColumnFiltersRefusal['reason'], string>
> = {
  'invalid-filter':
    'A column filter in this request is not one this table can apply, so no rows were read.',
  unreadable:
    'The filter in this request could not be read, so no rows were read.',
};

export const parseTablePageParams = ({
  defaultLimit,
  fallbackSort,
  ignoredSortColumns,
  params,
}: ParseTablePageParamsArgs): TablePageParamsResolution => {
  const filter = parseColumnFilters(params);

  if (filter.kind === 'refused') {
    return {
      kind: 'refused',
      message: FILTER_REFUSAL_MESSAGE[filter.reason],
      reason: filter.reason,
    };
  }

  const rawCursor = safeJsonParse(params.get('cursor'));
  const rawSort = safeJsonParse(params.get('sort'));

  return {
    kind: 'parsed',
    params: {
      ...(Array.isArray(rawCursor) && { cursor: rawCursor }),
      filters: toQueryFilters({ filters: filter.filters }),
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
    },
  };
};
