import type { ColumnVisibilityState } from '@repo/ui/components/Table/Table.types';

import { getPinnedDerivedColumnsState } from '@repo/ui/components/Table/utils';

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
