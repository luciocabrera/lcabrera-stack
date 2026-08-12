import type { SortingState } from '#ui/components/Table';

import { sortingCodec } from './sortingCodec.util';

/**
 * Deserialize a compact sorting URL param back to SortingState.
 *
 * Converts `{"name":"asc"}` back to `[{ columnKey: "name", direction: "asc" }]`.
 * Preserves insertion order from the object. A param carrying any direction
 * outside `asc`/`desc` is refused whole and yields an unsorted table.
 *
 * Only the direction vocabulary is closed here. The column key stays an
 * arbitrary string, and **nothing in the loader path checks it against a
 * table's real columns** — `sanitizeSorting` drops only undirected entries and
 * the UI-only `actions` key. The guards are server-side, in `buildOrderByClause`:
 * `assertSafeIdentifier` rejects anything outside `[a-z_][a-z0-9_]*` on every
 * column with no caller opt-out, and `assertColumnAllowed` narrows to a
 * permitted set only for queries that pass `allowedColumns`.
 */
export const deserializeSortingFromURL = <TData>(param: string) =>
  Object.entries(sortingCodec.deserialize(param)).map(
    ([columnKey, direction]) => ({
      columnKey: columnKey as SortingState<TData>[number]['columnKey'],
      direction,
    }),
  );
