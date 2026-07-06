// @vitest-environment jsdom

import { createTableConfigColumnsActionMocks } from '@repo/ui/utils/tests/createTableConfigColumnsActionMocks.util';
import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { useAcceptHeaderPinSide } from './useAcceptHeaderPinSide.hook';

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
  '@repo/ui/components/Table/contexts/TableConfig/useTableConfigContextValue.hook',
  () => ({
    useTableConfigContextValue: () => mockUseTableConfigContextValue(),
  }),
);

vi.mock('@repo/ui/components/Table/hooks', () => ({
  usePersistTableStateAction: () => mockUsePersistTableStateAction(),
}));

vi.mock(
  '@repo/ui/contexts/GlobalSettingsContext/selectors/useGetGlobalPinConflictResolutionPreference.hook',
  () => ({
    useGetGlobalPinConflictResolutionPreference: () => {},
  }),
);

describe('useAcceptHeaderPinSide', () => {
  beforeEach(() => {
    setColumnsState(createInitialColumnsState());
    resetMocks();
  });

  it('syncs column order when pinning a column through the header flow', () => {
    const { result } = renderHook(() =>
      useAcceptHeaderPinSide<{
        readonly age: string;
        readonly id: string;
        readonly name: string;
      }>(),
    );

    act(() => {
      result.current({ columnKey: 'name', pinSide: 'left' });
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
});
