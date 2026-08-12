import type { SortingState } from '#ui/components/Table';

import { sortingCodec } from './sortingCodec.util';

/**
 * Deserialize a compact sorting URL param back to SortingState.
 *
 * Converts `{"name":"asc"}` back to `[{ columnKey: "name", direction: "asc" }]`.
 * Preserves insertion order from the object. A param carrying any direction
 * outside `asc`/`desc` is refused whole and yields an unsorted table. The column
 * key stays a bare string — it is checked against the real columns downstream by
 * `sanitizeSorting`, which the codec has no way to do.
 */
export const deserializeSortingFromURL = <TData>(param: string) =>
  Object.entries(sortingCodec.deserialize(param)).map(
    ([columnKey, direction]) => ({
      columnKey: columnKey as SortingState<TData>[number]['columnKey'],
      direction,
    }),
  );
