import type {
  ColumnOrderState,
  ColumnPinningState,
  PinnedColumnOffsetsState,
  PinnedColumnPartitionState,
  TableColumn,
} from '@lcabrera/ui/components/Table/Table.types';

import { describe, expect, it, vi } from 'vite-plus/test';

import { commitPinningAndOrderUpdate } from './commitPinningAndOrderUpdate.util';

describe('commitPinningAndOrderUpdate', () => {
  it('persists pinning and order, then updates the columns store', () => {
    type TestRow = {
      readonly age: string;
      readonly id: string;
      readonly name: string;
    };

    const columnsStore = { set: vi.fn() };
    const persistTableState = vi.fn(() => true);
    const newPinning: ColumnPinningState<TestRow> = {
      left: ['id'],
      right: ['age'],
    };
    const newColumnOrder: ColumnOrderState<TestRow> = ['id', 'name', 'age'];
    const effectiveColumns: TableColumn<TestRow>[] = [
      { key: 'id', label: 'ID' },
      { key: 'name', label: 'Name' },
      { key: 'age', label: 'Age' },
    ];
    const pinnedColumnPartition: PinnedColumnPartitionState<TestRow> = {
      centerCols: [{ key: 'name', label: 'Name' }],
      leftPinnedCols: [{ key: 'id', label: 'ID' }],
      rightPinnedCols: [{ key: 'age', label: 'Age' }],
    };
    const pinnedColumnOffsets: PinnedColumnOffsetsState<TestRow> = {
      age: {
        isFirstPinnedRight: true,
        isLastPinnedLeft: false,
        offset: 0,
        side: 'right' as const,
      },
      id: {
        isFirstPinnedRight: false,
        isLastPinnedLeft: true,
        offset: 0,
        side: 'left' as const,
      },
    };

    commitPinningAndOrderUpdate<TestRow>({
      columnsStore,
      effectiveColumns,
      newColumnOrder,
      newPinning,
      persistenceKey: 'orders-table',
      persistTableState,
      pinnedColumnOffsets,
      pinnedColumnPartition,
    });

    expect(persistTableState).toHaveBeenCalledWith([
      {
        persistenceKey: 'orders-table',
        slice: 'columnPinning',
        valueSlice: newPinning,
      },
      {
        persistenceKey: 'orders-table',
        slice: 'columnOrder',
        valueSlice: newColumnOrder,
      },
    ]);
    expect(columnsStore.set).toHaveBeenCalledWith({
      columnOrder: newColumnOrder,
      columnPinning: newPinning,
      effectiveColumns,
      pinnedColumnOffsets,
      pinnedColumnPartition,
    });
  });
});
