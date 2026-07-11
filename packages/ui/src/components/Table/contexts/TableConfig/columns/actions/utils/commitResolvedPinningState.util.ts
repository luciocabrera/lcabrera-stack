import { getPinnedDerivedColumnsState } from '@repo/ui/components/Table/utils';

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
  metaStore,
  persistenceKey,
  persistTableState,
}: CommitResolvedPinningStateArgs<TData>) => {
  const { columnGroups, effectiveColumns, pinnedColumnOffsets } =
    getPinnedDerivedColumnsState<TData>({
      columnOrder,
      columnPinning,
      columns,
      columnSizing,
      columnVisibility,
    });

  if (
    !commitPinningAndOrderUpdate<TData>({
      columnGroups,
      columnsStore,
      effectiveColumns,
      newColumnOrder: columnOrder,
      newPinning: columnPinning,
      persistenceKey,
      persistTableState,
      pinnedColumnOffsets,
    })
  ) {
    return;
  }

  metaStore.set({ drawersSyncNonce: drawersSyncNonce + 1 });
};
