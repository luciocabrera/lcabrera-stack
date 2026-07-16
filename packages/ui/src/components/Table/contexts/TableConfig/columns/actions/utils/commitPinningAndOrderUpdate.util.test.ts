import type {
  ColumnGroupsState,
  ColumnOrderState,
  ColumnPinningState,
  PinnedColumnOffsetsState,
  TableColumn,
} from '@repo/ui/components/Table/Table.types';

import { describe, expect, it, vi } from 'vitest';

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
    const columnGroups: ColumnGroupsState<TestRow> = {
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
      columnGroups,
      columnsStore,
      effectiveColumns,
      newColumnOrder,
      newPinning,
      persistenceKey: 'orders-table',
      persistTableState,
      pinnedColumnOffsets,
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
      columnGroups,
      columnOrder: newColumnOrder,
      columnPinning: newPinning,
      effectiveColumns,
      pinnedColumnOffsets,
    });
  });
});
