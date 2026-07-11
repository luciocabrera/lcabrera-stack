import type {
  ColumnGroupsState,
  ColumnOrderState,
  ColumnPinningState,
  PinnedColumnOffsetsState,
  TableColumn,
  TableColumnsState,
} from '@repo/ui/components/Table/Table.types';

import type { PersistTableStateEntry } from './commitResolvedColumnState.types';

type CommitPinningAndOrderUpdateArgs<TData> = {
  readonly columnGroups: ColumnGroupsState<TData>;
  readonly columnsStore: {
    readonly set: (state: Partial<TableColumnsState<TData>>) => void;
  };
  readonly effectiveColumns: TableColumn<TData>[];
  readonly newColumnOrder: ColumnOrderState<TData>;
  readonly newPinning: ColumnPinningState<TData>;
  readonly persistenceKey: string;
  readonly persistTableState: (
    entries: PersistTableStateEntry<'columnOrder' | 'columnPinning'>[],
  ) => boolean;
  readonly pinnedColumnOffsets: PinnedColumnOffsetsState<TData>;
};

export const commitPinningAndOrderUpdate = <TData>({
  columnGroups,
  columnsStore,
  effectiveColumns,
  newColumnOrder,
  newPinning,
  persistenceKey,
  persistTableState,
  pinnedColumnOffsets,
}: CommitPinningAndOrderUpdateArgs<TData>) => {
  if (
    !persistTableState([
      {
        persistenceKey,
        slice: 'columnPinning',
        valueSlice: newPinning,
      },
      {
        persistenceKey,
        slice: 'columnOrder',
        valueSlice: newColumnOrder,
      },
    ])
  ) {
    return false;
  }

  columnsStore.set({
    columnGroups,
    columnOrder: newColumnOrder,
    columnPinning: newPinning,
    effectiveColumns,
    pinnedColumnOffsets,
  });

  return true;
};
