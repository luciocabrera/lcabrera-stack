import { getPinnedDerivedColumnsState } from '#ui/components/Table/utils';

import type { CommitResolvedColumnStateArgs } from './commitResolvedColumnState.types';

import { commitPinningAndOrderUpdate } from './commitPinningAndOrderUpdate.util';

type CommitResolvedPinningStateArgs<TData> = CommitResolvedColumnStateArgs<
  TData,
  'columnOrder' | 'columnPinning'
>;

export const commitResolvedPinningState = <TData>({
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
}: CommitResolvedPinningStateArgs<TData>) => {
  const { effectiveColumns, pinnedColumnOffsets, pinnedColumnPartition } =
    getPinnedDerivedColumnsState<TData>({
      columnOrder,
      columnPinning,
      columns,
      columnSizing,
      columnVisibility,
      groupingKeys,
    });

  if (
    !commitPinningAndOrderUpdate<TData>({
      columnsStore,
      effectiveColumns,
      newColumnOrder: columnOrder,
      newPinning: columnPinning,
      persistenceKey,
      persistTableState,
      pinnedColumnOffsets,
      pinnedColumnPartition,
    })
  ) {
    return;
  }

  metaStore.set({ drawersSyncNonce: drawersSyncNonce + 1 });
};
