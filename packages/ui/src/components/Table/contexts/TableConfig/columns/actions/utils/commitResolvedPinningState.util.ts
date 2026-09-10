import { getPinnedDerivedColumnsState } from '#ui/components/Table/utils';

import type { CommitResolvedColumnStateArgs } from './commitResolvedColumnState.types';

import { commitPinningAndOrderUpdate } from './commitPinningAndOrderUpdate.util';

type CommitResolvedPinningStateArgs<TData> = CommitResolvedColumnStateArgs<
  TData,
  'columnOrder' | 'columnPinning'
>;

export const commitResolvedPinningState = <TData>(
  args: CommitResolvedPinningStateArgs<TData>,
) => {
  const { effectiveColumns, pinnedColumnOffsets, pinnedColumnPartition } =
    getPinnedDerivedColumnsState<TData>(args);

  if (
    !commitPinningAndOrderUpdate<TData>({
      columnsStore: args.columnsStore,
      effectiveColumns,
      newColumnOrder: args.columnOrder,
      newPinning: args.columnPinning,
      persistenceKey: args.persistenceKey,
      persistTableState: args.persistTableState,
      pinnedColumnOffsets,
      pinnedColumnPartition,
    })
  ) {
    return;
  }

  args.metaStore.set({ drawersSyncNonce: args.drawersSyncNonce + 1 });
};
