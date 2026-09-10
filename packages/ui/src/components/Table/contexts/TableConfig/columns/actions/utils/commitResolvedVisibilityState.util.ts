import type { ColumnVisibilityState } from '#ui/components/Table/Table.types';

import { getPinnedDerivedColumnsState } from '#ui/components/Table/utils';

import type { CommitResolvedColumnStateArgs } from './commitResolvedColumnState.types';

type CommitResolvedVisibilityStateArgs<TData> = CommitResolvedColumnStateArgs<
  TData,
  'columnVisibility'
> & {
  readonly columnVisibility: ColumnVisibilityState<TData>;
};

export const commitResolvedVisibilityState = <TData>(
  args: CommitResolvedVisibilityStateArgs<TData>,
) => {
  const { effectiveColumns, pinnedColumnOffsets, pinnedColumnPartition } =
    getPinnedDerivedColumnsState<TData>(args);

  if (
    !args.persistTableState([
      {
        persistenceKey: args.persistenceKey,
        slice: 'columnVisibility',
        valueSlice: args.columnVisibility,
      },
    ])
  ) {
    return false;
  }

  args.columnsStore.set({
    columnVisibility: args.columnVisibility,
    effectiveColumns,
    pinnedColumnOffsets,
    pinnedColumnPartition,
  });

  args.metaStore.set({ drawersSyncNonce: args.drawersSyncNonce + 1 });

  return true;
};
