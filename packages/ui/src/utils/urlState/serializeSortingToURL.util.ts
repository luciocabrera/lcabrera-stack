import type { SortingState } from '#ui/components/Table';

import { sortingCodec } from './sortingCodec.util';

/**
 * Serialize SortingState to a compact URL-friendly string.
 *
 * Converts `[{ columnKey: "name", direction: "asc" }]`
 * into `{"name":"asc"}` — much shorter than the verbose array format.
 * Returns undefined when nothing carries a direction, so the caller leaves the
 * param off the URL entirely.
 *
 * Built with `Object.fromEntries` rather than by assigning into `{}`, so a
 * `__proto__` column key becomes an own property instead of hitting the
 * prototype setter and vanishing from the serialized param.
 */
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
