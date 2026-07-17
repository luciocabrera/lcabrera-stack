import type {
  DataKey,
  TableColumnsState,
} from '@repo/ui/components/Table/Table.types';
import type { TStore } from '@repo/ui/hooks/useStore.hook';

import { resolveColumnSizingUpdate } from './resolveColumnSizingUpdate.util';

type WriteColumnSizingArgs<TData> = {
  readonly columnKey: DataKey<TData>;
  readonly columnsStore: TStore<TableColumnsState<TData>>;
  readonly width: number | undefined;
};

/**
 * Writes one column's width to the columns store and recomputes the pinned
 * offsets that depend on it. Shared by every sizing action so they never have
 * to call one another; pass `width: undefined` to drop the column back to its
 * default.
 *
 * Persistence is deliberately not here — see `usePersistColumnSizingAction`.
 */
export const writeColumnSizing = <TData>({
  columnKey,
  columnsStore,
  width,
}: WriteColumnSizingArgs<TData>) => {
  const columnsState = columnsStore.get();
  const { columnSizing, pinnedColumnOffsets } =
    resolveColumnSizingUpdate<TData>({
      columnKey,
      columnPinning: columnsState?.columnPinning,
      columnSizingState: columnsState?.columnSizing,
      effectiveColumns: columnsState?.effectiveColumns ?? [],
      width,
    });

  columnsStore.set({ columnSizing, pinnedColumnOffsets });
};
