import type { SortingState } from '#ui/components/Table';

import type { CompactSorting } from './urlState.types';

import { sortingCodec } from './sortingCodec.util';

/**
 * Serialize SortingState to a compact URL-friendly string.
 *
 * Converts `[{ columnKey: "name", direction: "asc" }]`
 * into `{"name":"asc"}` — much shorter than the verbose array format.
 * Returns undefined when nothing carries a direction, so the caller leaves the
 * param off the URL entirely.
 */
export const serializeSortingToURL = <TData>(sorting: SortingState<TData>) => {
  const compact = sorting.reduce<CompactSorting>(
    (accumulator, { columnKey, direction }) => {
      if (direction !== undefined) {
        accumulator[columnKey] = direction;
      }

      return accumulator;
    },
    {},
  );

  if (Object.keys(compact).length === 0) return;

  return sortingCodec.serialize(compact);
};
