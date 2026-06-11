// @vitest-environment jsdom

import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { useAcceptHeaderPinSide } from './useAcceptHeaderPinSide.hook';

const {
  mockColumnsStore,
  mockPersistTableState,
  mockUsePersistTableStateAction,
  mockUseTableConfigContextValue,
  setColumnsState,
} = vi.hoisted(() => {
  let columnsState = {
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

  const mockColumnsStore = {
    get: vi.fn(() => columnsState),
    set: vi.fn((value: Record<string, unknown>) => {
      columnsState = { ...columnsState, ...value };
    }),
  };

  const mockMetaStore = {
    get: vi.fn(() => ({ persistenceKey: 'orders-table' })),
  };

  const mockPersistTableState = vi.fn();

  return {
    mockColumnsStore,
    mockPersistTableState,
    mockUsePersistTableStateAction: () => mockPersistTableState,
    mockUseTableConfigContextValue: () => ({
      columnsStore: mockColumnsStore,
      metaStore: mockMetaStore,
    }),
    setColumnsState: (nextState: typeof columnsState) => {
      columnsState = nextState;
    },
  };
});

vi.mock(
  '@/components/Table/contexts/TableConfig/useTableConfigContextValue.hook',
  () => ({
    useTableConfigContextValue: mockUseTableConfigContextValue,
  }),
);

vi.mock('@/components/Table/hooks', () => ({
  usePersistTableStateAction: mockUsePersistTableStateAction,
}));

vi.mock(
  '@/contexts/GlobalSettingsContext/selectors/useGetGlobalPinConflictResolutionPreference.hook',
  () => ({
    useGetGlobalPinConflictResolutionPreference: () => undefined,
  }),
);

describe('useAcceptHeaderPinSide', () => {
  beforeEach(() => {
    setColumnsState({
      columnOrder: ['name', 'id', 'age'],
      columnPinning: { left: ['id'], right: [] },
      columnSizing: {},
      columnVisibility: new Set<string>(),
      columns: [
        { key: 'id', label: 'ID' },
        { key: 'name', label: 'Name' },
        { key: 'age', label: 'Age' },
      ],
    });
    mockColumnsStore.set.mockClear();
    mockPersistTableState.mockClear();
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
  });
});
