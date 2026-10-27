import { isObject } from '@lcabrera/utils/guards/is-object.util';
import { safeJsonParse } from '@lcabrera/utils/json/safe-json-parse.util';

import type { ColumnFilters, ColumnFiltersParse } from './filters.types.ts';

import { COLUMN_FILTERS_PARAM } from './filters.constants.ts';
import { isColumnFilter } from './is-column-filter.util.ts';

export const parseColumnFilters = (
  params: URLSearchParams,
): ColumnFiltersParse => {
  if (!params.has(COLUMN_FILTERS_PARAM)) return { filters: {}, kind: 'parsed' };

  const decoded = safeJsonParse(params.get(COLUMN_FILTERS_PARAM));

  if (!isObject(decoded) || Array.isArray(decoded)) {
    return { kind: 'refused', reason: 'unreadable' };
  }

  const invalid = Object.entries(decoded).find(
    ([, filter]) => !isColumnFilter(filter),
  );

  return invalid === undefined
    ? { filters: decoded as ColumnFilters, kind: 'parsed' }
    : { column: invalid[0], kind: 'refused', reason: 'invalid-filter' };
};
