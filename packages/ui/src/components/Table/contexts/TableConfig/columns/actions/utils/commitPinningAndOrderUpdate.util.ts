import type {
  ColumnOrderState,
  ColumnPinningState,
  PinnedColumnOffsetsState,
  PinnedColumnPartitionState,
  TableColumn,
  TableColumnsState,
  TablePersistenceSliceEntry,
} from '@repo/ui/components/Table/Table.types';
import type { TStore } from '@repo/ui/hooks/useStore.hook';

type CommitPinningAndOrderUpdateArgs<TData> = {
  readonly columnsStore: Pick<TStore<TableColumnsState<TData>>, 'set'>;
  readonly effectiveColumns: TableColumn<TData>[];
  readonly newColumnOrder: ColumnOrderState<TData>;
  readonly newPinning: ColumnPinningState<TData>;
  readonly persistenceKey: string;
  readonly persistTableState: (
    entries: TablePersistenceSliceEntry<'columnOrder' | 'columnPinning'>[],
  ) => boolean;
  readonly pinnedColumnOffsets: PinnedColumnOffsetsState<TData>;
  readonly pinnedColumnPartition: PinnedColumnPartitionState<TData>;
};

export const commitPinningAndOrderUpdate = <TData>({
  columnsStore,
  effectiveColumns,
  newColumnOrder,
  newPinning,
  persistenceKey,
  persistTableState,
  pinnedColumnOffsets,
  pinnedColumnPartition,
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
    columnOrder: newColumnOrder,
    columnPinning: newPinning,
    effectiveColumns,
    pinnedColumnOffsets,
    pinnedColumnPartition,
  });

  return true;
};
