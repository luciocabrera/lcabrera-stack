import { getPinnedDerivedColumnsState } from '#ui/components/Table/utils';

import type { CommitResolvedColumnStateArgs } from './commitResolvedColumnState.types';

import { commitPinningAndOrderUpdate } from './commitPinningAndOrderUpdate.util';

type CommitResolvedPinningStateArgs<TData> = CommitResolvedColumnStateArgs<
  TData,
  'columnOrder' | 'columnPinning'
>;

export const commitResolvedPinningState = <TData>({
  columnsStore,
  drawersSyncNonce,
  metaStore,
  persistenceKey,
  persistTableState,
  ...derived
}: CommitResolvedPinningStateArgs<TData>) => {
  const { effectiveColumns, pinnedColumnOffsets, pinnedColumnPartition } =
    getPinnedDerivedColumnsState<TData>(derived);

  if (
    !commitPinningAndOrderUpdate<TData>({
      columnsStore,
      effectiveColumns,
      newColumnOrder: derived.columnOrder,
      newPinning: derived.columnPinning,
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
