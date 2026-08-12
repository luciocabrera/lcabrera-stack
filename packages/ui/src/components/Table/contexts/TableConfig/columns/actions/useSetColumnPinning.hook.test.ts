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
  setColumnsState,
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
