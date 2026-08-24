import type { SortingState } from '#ui/components/Table';

import { sortingCodec } from './sortingCodec.util';

/**
 * The column key stays an arbitrary string, and **nothing in the loader path checks it
 * against a table's real columns** — `sanitizeSorting` drops only undirected entries and
 * the UI-only `actions` key.
 */
export const deserializeSortingFromURL = <TData>(param: string) =>
  Object.entries(sortingCodec.deserialize(param)).map(
    ([columnKey, direction]) => ({
      columnKey: columnKey as SortingState<TData>[number]['columnKey'],
      direction,
    }),
  );
