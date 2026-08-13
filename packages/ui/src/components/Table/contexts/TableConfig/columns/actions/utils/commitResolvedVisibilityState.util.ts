import type { ColumnVisibilityState } from '#ui/components/Table/Table.types';

import { getPinnedDerivedColumnsState } from '#ui/components/Table/utils';

import type { CommitResolvedColumnStateArgs } from './commitResolvedColumnState.types';

type CommitResolvedVisibilityStateArgs<TData> = CommitResolvedColumnStateArgs<
  TData,
  'columnVisibility'
> & {
  /** Visibility commits always carry the resolved visibility set */
  readonly columnVisibility: ColumnVisibilityState<TData>;
};

export const commitResolvedVisibilityState = <TData>({
  columnOrder,
  columnPinning,
  columns,
  columnSizing,
  columnsStore,
  columnVisibility,
  drawersSyncNonce,
  groupingKeys,
  metaStore,
  persistenceKey,
  persistTableState,
}: CommitResolvedVisibilityStateArgs<TData>) => {
  const { effectiveColumns, pinnedColumnOffsets, pinnedColumnPartition } =
    getPinnedDerivedColumnsState<TData>({
      columnOrder,
      columnPinning,
      columns,
      columnSizing,
      columnVisibility,
      groupingKeys,
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
    columnVisibility,
    effectiveColumns,
    pinnedColumnOffsets,
    pinnedColumnPartition,
  });

  metaStore.set({ drawersSyncNonce: drawersSyncNonce + 1 });

  return true;
};
