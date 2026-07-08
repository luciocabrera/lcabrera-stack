import type {
  ColumnOrderState,
  ColumnPinningState,
  ColumnSizingState,
  ColumnVisibilityState,
  TableColumn,
  TableColumnsState,
  TableMetaState,
} from '@repo/ui/components/Table/Table.types';

import { getPinnedDerivedColumnsState } from '@repo/ui/components/Table/utils';

type CommitResolvedVisibilityStateArgs<TData> = {
  readonly columnOrder: ColumnOrderState<TData>;
  readonly columnPinning: ColumnPinningState<TData>;
  readonly columns: readonly TableColumn<TData>[];
  readonly columnSizing?: ColumnSizingState<TData>;
  readonly columnsStore: {
    readonly set: (state: Partial<TableColumnsState<TData>>) => void;
  };
  readonly columnVisibility: ColumnVisibilityState<TData>;
  readonly drawersSyncNonce: number;
  readonly metaStore: {
    readonly set: (state: Partial<TableMetaState>) => void;
  };
  readonly persistenceKey: string;
  readonly persistTableState: (
    entries: {
      readonly persistenceKey: string;
      readonly slice: 'columnVisibility';
      readonly valueSlice: unknown;
    }[],
  ) => boolean;
};

/**
 * Recomputes derived column view state (groups/effective columns/pinned
 * offsets) for a columnVisibility change, persists it, commits it to the
 * live columnsStore, and bumps drawersSyncNonce so any open settings drawer
 * resyncs — mirrors commitResolvedPinningState.util.ts for pinning.
 */
export const commitResolvedVisibilityState = <TData>({
  columnOrder,
  columnPinning,
  columns,
  columnSizing,
  columnsStore,
  columnVisibility,
  drawersSyncNonce,
  metaStore,
  persistenceKey,
  persistTableState,
}: CommitResolvedVisibilityStateArgs<TData>) => {
  const { columnGroups, effectiveColumns, pinnedColumnOffsets } =
    getPinnedDerivedColumnsState<TData>({
      columnOrder,
      columnPinning,
      columns,
      columnSizing,
      columnVisibility,
    });

  const didPersist = persistTableState([
    {
      persistenceKey,
      slice: 'columnVisibility',
      valueSlice: columnVisibility,
    },
  ]);

  if (!didPersist) return false;

  columnsStore.set({
    columnGroups,
    columnVisibility,
    effectiveColumns,
    pinnedColumnOffsets,
  });

  metaStore.set({ drawersSyncNonce: drawersSyncNonce + 1 });

  return true;
};
