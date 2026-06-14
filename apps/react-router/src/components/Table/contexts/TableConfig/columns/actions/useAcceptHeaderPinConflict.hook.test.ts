// @vitest-environment jsdom

import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { createTableConfigColumnsActionMocks } from '@/utils/tests/createTableConfigColumnsActionMocks.util';

import { useAcceptHeaderPinConflict } from './useAcceptHeaderPinConflict.hook';

const createInitialColumnsState = () => {
  return {
    columnOrder: ['name', 'id', 'age'],
    columnPinning: { left: ['id'], right: [] },
    columnSizing: {},
    columnVisibility: new Set<string>(),
    columns: [
      { key: 'id', label: 'ID' },
      { key: 'name', label: 'Name' },
      { key: 'age', label: 'Age' },
    ],
  };
};

const {
  mockColumnsStore,
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
  '@/components/Table/contexts/TableConfig/useTableConfigContextValue.hook',
  () => ({
    useTableConfigContextValue: () => mockUseTableConfigContextValue(),
  }),
);

vi.mock('@/components/Table/hooks', () => ({
  usePersistTableStateAction: () => mockUsePersistTableStateAction(),
}));

describe('useAcceptHeaderPinConflict', () => {
  beforeEach(() => {
    setColumnsState(createInitialColumnsState());
    resetMocks();
  });

  it('syncs column order when resolving a pin-all-between header conflict', () => {
    const { result } = renderHook(() =>
      useAcceptHeaderPinConflict<{
        readonly age: string;
        readonly id: string;
        readonly name: string;
      }>(),
    );

    act(() => {
      result.current({
        columnKey: 'name',
        resolution: 'pin-all-between',
        side: 'left',
      });
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
  });
});
