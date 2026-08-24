import { isObject } from '@lcabrera/utils/guards/is-object.util';

import type { ColumnFiltersState } from '#ui/components/Table';
import type { ColumnFilter } from '#ui/types/filterOperators.types';

import { createUrlStateCodec } from './createUrlStateCodec.util';
import { deserializeFilter } from './deserializeFilter.util';
import { serializeFilter } from './serializeFilter.util';

/**
 * That per-entry drop is the pre-existing filter contract, kept deliberately and pinned by
 * an existing test.
 * What rejects a filter a column cannot carry is `sanitizeFiltersByColumns` in the loader
 * path, which drops unknown column keys and runs `isFilterCompatibleWithColumn` against
 * each column's declared `dataType` — though only when the loader passes it `columns`,
 * which is optional.
 */
const narrowCompactFilters = (parsed: unknown) => {
  if (!isObject(parsed) || Array.isArray(parsed)) {
    return;
  }

  return Object.fromEntries(
    Object.entries(parsed)
      .map(
        ([columnKey, value]) => [columnKey, deserializeFilter(value)] as const,
      )
      .filter(
        (entry): entry is [string, ColumnFilter] => entry[1] !== undefined,
      ),
  );
};

export const filtersCodec = createUrlStateCodec<ColumnFiltersState>({
  compact: (state) =>
    Object.fromEntries(
      Object.entries(state).map(([columnKey, filter]) => [
        columnKey,
        serializeFilter({ filter }),
      ]),
    ),
  fallback: {},
  label: 'filters',
  narrow: narrowCompactFilters,
});
