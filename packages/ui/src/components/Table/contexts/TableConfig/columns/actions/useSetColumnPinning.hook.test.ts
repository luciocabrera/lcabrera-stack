// @vitest-environment jsdom

import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vite-plus/test';

import { createTableConfigColumnsActionMocks } from '#ui/utils/tests/createTableConfigColumnsActionMocks.util';

import { useSetColumnPinning } from './useSetColumnPinning.hook';

const createInitialColumnsState = () => {
  return {
    columnOrder: ['name', 'id', 'age'],
    columnPinning: { left: ['id'], right: [] },
    columns: [
      { key: 'id', label: 'ID' },
      { key: 'name', label: 'Name' },
      { key: 'age', label: 'Age' },
    ],
    columnSizing: {},
    columnVisibility: new Set<string>(),
  };
};

const {
  mockColumnsStore,
  mockMetaStore,
  mockPersistTableState,
  mockUsePersistTableStateAction,
  mockUseTableConfigContextValue,
  resetMocks,
  setAggregates,
  setColumnsState,
  setGroupingKeys,
} = createTableConfigColumnsActionMocks({
  initialColumnsState: createInitialColumnsState(),
  persistenceKey: 'orders-table',
});

vi.mock(
  '#ui/components/Table/contexts/TableConfig/useTableConfigContextValue.hook',
  () => ({
    useTableConfigContextValue: () => mockUseTableConfigContextValue(),
  }),
);

vi.mock('./hooks/usePersistTableStateAction.hook', () => ({
  usePersistTableStateAction: () => mockUsePersistTableStateAction(),
}));

describe('useSetColumnPinning', () => {
  beforeEach(() => {
    setColumnsState(createInitialColumnsState());
    resetMocks();
  });

  it('syncs column order when pinning a column left', () => {
    const { result } = renderHook(() =>
      useSetColumnPinning<{
        readonly age: string;
        readonly id: string;
        readonly name: string;
      }>(),
    );

    act(() => {
      result.current({ columnKey: 'name', side: 'left' });
    });

    expect(mockPersistTableState).toHaveBeenCalledWith([
      {
        persistenceKey: 'orders-table',
        slice: 'columnPinning',
        valueSlice: { left: ['id', 'name'], right: [] },
      },
      {
        persistenceKey: 'orders-table',
        slice: 'columnOrder',
        valueSlice: ['id', 'name', 'age'],
      },
    ]);
    expect(mockColumnsStore.set).toHaveBeenCalledWith(
      expect.objectContaining({
        columnOrder: ['id', 'name', 'age'],
        columnPinning: { left: ['id', 'name'], right: [] },
      }),
    );
    expect(mockMetaStore.set).toHaveBeenCalledWith({ drawersSyncNonce: 1 });
  });

  it('syncs column order when unpinning a left-pinned column', () => {
    setColumnsState({
      ...createInitialColumnsState(),
      columnOrder: ['name', 'id', 'age'],
      columnPinning: { left: ['name', 'id'], right: [] },
    });

    const { result } = renderHook(() =>
      useSetColumnPinning<{
        readonly age: string;
        readonly id: string;
        readonly name: string;
      }>(),
    );

    act(() => {
      result.current({ columnKey: 'name', side: undefined });
    });

    expect(mockPersistTableState).toHaveBeenCalledWith([
      {
        persistenceKey: 'orders-table',
        slice: 'columnPinning',
        valueSlice: { left: ['id'], right: [] },
      },
      {
        persistenceKey: 'orders-table',
        slice: 'columnOrder',
        valueSlice: ['id', 'name', 'age'],
      },
    ]);

    expect(mockColumnsStore.set).toHaveBeenCalledWith(
      expect.objectContaining({
        columnOrder: ['id', 'name', 'age'],
        columnPinning: { left: ['id'], right: [] },
      }),
    );
    expect(mockMetaStore.set).toHaveBeenCalledWith({ drawersSyncNonce: 1 });
  });
});

describe('pinning a measure column', () => {
  beforeEach(() => {
    setColumnsState({
      columnOrder: ['name', 'id', 'age', 'amount'],
      columnPinning: { left: [], right: [] },
      columns: [
        { key: 'id', label: 'ID' },
        { key: 'name', label: 'Name' },
        { key: 'age', label: 'Age' },
        { key: 'amount', label: 'Amount' },
      ],
      columnSizing: {},
      columnVisibility: new Set<string>(),
    });
    resetMocks();
    setGroupingKeys(['name']);
    setAggregates([
      { columnKey: 'amount', fn: 'avg' },
      { columnKey: 'amount', fn: 'min' },
    ]);
  });

  it('pins the column it measures, not the derived key', () => {
    // Column order and pinning are the user's persisted layout, restored into
    // a grid that may carry no grouping at all — so a measure key written
    // there is a preference about a column that will not exist next time.
    // It also duplicated the column: the derived key is not in the declared
    // order, so `syncColumnOrderWithPinning`'s removal filter was a no-op and
    // the next derivation produced `amount:avg` from both entries.
    const { result } = renderHook(() =>
      useSetColumnPinning<Record<string, unknown>>(),
    );

    act(() => {
      result.current({ columnKey: 'amount:avg', side: 'left' });
    });

    expect(mockColumnsStore.set).toHaveBeenCalledWith(
      expect.objectContaining({
        // The declared key throughout — no measure key reaches either list,
        // and neither list repeats a key.
        columnOrder: ['amount', 'name', 'id', 'age'],
        columnPinning: { left: ['amount'], right: [] },
      }),
    );
  });
});
