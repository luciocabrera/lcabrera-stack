import { isObject } from '@lcabrera/utils/guards/is-object.util';

import type { ColumnFiltersState } from '#ui/components/Table';
import type { ColumnFilter } from '#ui/types/filterOperators.types';

import { createUrlStateCodec } from './createUrlStateCodec.util';
import { deserializeFilter } from './deserializeFilter.util';
import { serializeFilter } from './serializeFilter.util';

/**
 * Accepts a `{ columnKey: compactFilter }` object; an array, a bare string or a
 * number refuses the payload whole.
 *
 * Inside a recognised object each value goes through `deserializeFilter`, whose
 * `undefined` drops that entry. That per-entry drop is the pre-existing filter
 * contract, kept deliberately and pinned by an existing test.
 *
 * Be careful what it does and does not buy. `deserializeFilter` does **not**
 * reject an unknown operator code: its last branch reads any all-strings array
 * as a select-equals filter, so `["ZZ","x"]` yields a select filter over the
 * values `ZZ` and `x` rather than nothing. What rejects a filter a column
 * cannot carry is `sanitizeFiltersByColumns` in the loader path, which drops
 * unknown column keys and runs `isFilterCompatibleWithColumn` against each
 * column's declared `dataType`. This codec closes the envelope; that pass
 * closes the rest.
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

/** Codec for the compact `filters` search param. */
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
