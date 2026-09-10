import type { ColumnVisibilityState } from '#ui/components/Table/Table.types';

import { getPinnedDerivedColumnsState } from '#ui/components/Table/utils';

import type { CommitResolvedColumnStateArgs } from './commitResolvedColumnState.types';

type CommitResolvedVisibilityStateArgs<TData> = CommitResolvedColumnStateArgs<
  TData,
  'columnVisibility'
> & {
  readonly columnVisibility: ColumnVisibilityState<TData>;
};

export const commitResolvedVisibilityState = <TData>({
  columnsStore,
  columnVisibility,
  drawersSyncNonce,
  metaStore,
  persistenceKey,
  persistTableState,
  ...derived
}: CommitResolvedVisibilityStateArgs<TData>) => {
  const { effectiveColumns, pinnedColumnOffsets, pinnedColumnPartition } =
    getPinnedDerivedColumnsState<TData>({ ...derived, columnVisibility });

  if (
    !persistTableState([
      {
        persistenceKey,
        slice: 'columnVisibility',
        valueSlice: columnVisibility,
      },
    ])
  ) {
    return false;
  }

  columnsStore.set({
    columnVisibility,
    effectiveColumns,
    pinnedColumnOffsets,
    pinnedColumnPartition,
  });

  metaStore.set({ drawersSyncNonce: drawersSyncNonce + 1 });

  return true;
};
