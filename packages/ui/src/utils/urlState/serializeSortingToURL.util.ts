import type { SortingState } from '#ui/components/Table';

import { sortingCodec } from './sortingCodec.util';

export const serializeSortingToURL = <TData>(sorting: SortingState<TData>) => {
  const entries = sorting
    .filter(
      (
        entry,
      ): entry is SortingState<TData>[number] & {
        readonly direction: 'asc' | 'desc';
      } => entry.direction !== undefined,
    )
    .map(({ columnKey, direction }) => [columnKey, direction] as const);

  if (entries.length === 0) return;

  return sortingCodec.serialize(Object.fromEntries(entries));
};
