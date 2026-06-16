import type {
  ColumnOrderState,
  ColumnPinningState,
  ColumnSizingState,
  ColumnVisibilityState,
  TableColumn,
  TableColumnsState,
  TableMetaState,
} from '@/components/Table/Table.types';

import { getPinnedDerivedColumnsState } from '@/components/Table/utils';

import { commitPinningAndOrderUpdate } from './commitPinningAndOrderUpdate.util';

type CommitResolvedPinningStateArgs<TData> = {
  readonly columnOrder: ColumnOrderState<TData>;
  readonly columnPinning: ColumnPinningState<TData>;
  readonly columnSizing?: ColumnSizingState<TData>;
  readonly columnVisibility?: ColumnVisibilityState<TData>;
  readonly columns: readonly TableColumn<TData>[];
  readonly columnsStore: {
    readonly set: (state: Partial<TableColumnsState<TData>>) => void;
  };
  readonly drawersSyncNonce: number;
  readonly metaStore: {
    readonly set: (state: Partial<TableMetaState>) => void;
  };
  readonly persistenceKey: string;
  readonly persistTableState: (
    entries: {
      readonly persistenceKey: string;
      readonly slice: 'columnOrder' | 'columnPinning';
      readonly valueSlice: unknown;
    }[],
  ) => void;
};

export const commitResolvedPinningState = <TData>({
  columnOrder,
  columnPinning,
  columnSizing,
  columnVisibility,
  columns,
  columnsStore,
  drawersSyncNonce,
  metaStore,
  persistenceKey,
  persistTableState,
}: CommitResolvedPinningStateArgs<TData>) => {
  const { columnGroups, effectiveColumns, pinnedColumnOffsets } =
    getPinnedDerivedColumnsState<TData>({
      columnOrder,
      columnPinning,
      columnSizing,
      columns,
      columnVisibility,
    });

  commitPinningAndOrderUpdate<TData>({
    columnGroups,
    columnsStore,
    effectiveColumns,
    newColumnOrder: columnOrder,
    newPinning: columnPinning,
    persistenceKey,
    persistTableState,
    pinnedColumnOffsets,
  });

  metaStore.set({ drawersSyncNonce: drawersSyncNonce + 1 });
};
