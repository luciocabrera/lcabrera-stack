import type {
  ColumnOrderState,
  ColumnPinningState,
  ColumnSizingState,
  ColumnVisibilityState,
  TableColumn,
  TableColumnsState,
  TableMetaState,
} from '@repo/ui/components/Table/Table.types';

import { getPinnedDerivedColumnsState } from '@repo/ui/components/Table/utils';

import { commitPinningAndOrderUpdate } from './commitPinningAndOrderUpdate.util';

type CommitResolvedPinningStateArgs<TData> = {
  readonly columnOrder: ColumnOrderState<TData>;
  readonly columnPinning: ColumnPinningState<TData>;
  readonly columns: readonly TableColumn<TData>[];
  readonly columnSizing?: ColumnSizingState<TData>;
  readonly columnsStore: {
    readonly set: (state: Partial<TableColumnsState<TData>>) => void;
  };
  readonly columnVisibility?: ColumnVisibilityState<TData>;
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
  ) => boolean;
};

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
