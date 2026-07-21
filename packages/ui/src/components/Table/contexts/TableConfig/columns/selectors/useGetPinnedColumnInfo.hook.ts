import type {
  DataKey,
  PinnedColumnInfo,
} from '@lcabrera/ui/components/Table/Table.types';

import { useColumnsStore } from '../useColumnsStore.hook';

/**
 * Selector for a single column's pinned-offset entry. Returns the entry, or
 * `undefined` for an unpinned (center) column — a stable `undefined` that
 * bails out, so only pinned cells re-render when the offset map is rebuilt.
 * Unlike `useGetPinnedColumnOffsets`, which returns the whole map (a fresh
 * reference on every sizing write) and re-renders every consumer.
 */
export const useGetPinnedColumnInfo = <TData>(columnKey: DataKey<TData>) =>
  useColumnsStore<PinnedColumnInfo | undefined, TData>(
    (state) => state.pinnedColumnOffsets[columnKey],
  );
