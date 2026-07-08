// @vitest-environment jsdom

import { createTableConfigColumnsActionMocks } from '@repo/ui/utils/tests/createTableConfigColumnsActionMocks.util';
import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { useSetColumnVisibility } from './useSetColumnVisibility.hook';

const createInitialColumnsState = () => {
  return {
    columnOrder: ['id', 'name', 'age'],
    columnPinning: { left: ['id'], right: [] },
    columns: [
      { key: 'id', label: 'ID' },
      { key: 'name', label: 'Name' },
      { key: 'age', label: 'Age' },
    ],
    columnSizing: {},
    columnVisibility: new Set<string>(),
    staticKeys: new Set<string>(['id']),
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

type TData = {
  readonly age: string;
  readonly id: string;
  readonly name: string;
};

describe('useSetColumnVisibility', () => {
  beforeEach(() => {
    setColumnsState(createInitialColumnsState());
    resetMocks();
  });

  it('hides a currently-visible column', () => {
    const { result } = renderHook(() => useSetColumnVisibility<TData>());

    act(() => {
      result.current({ columnKey: 'name', isVisible: false });
    });

    expect(mockPersistTableState).toHaveBeenCalledWith([
      {
        persistenceKey: 'orders-table',
        slice: 'columnVisibility',
        valueSlice: new Set(['name']),
      },
    ]);
    expect(mockColumnsStore.set).toHaveBeenCalledWith(
      expect.objectContaining({ columnVisibility: new Set(['name']) }),
    );
    expect(mockMetaStore.set).toHaveBeenCalledWith({ drawersSyncNonce: 1 });
  });

  it('shows a currently-hidden column', () => {
    setColumnsState({
      ...createInitialColumnsState(),
      columnVisibility: new Set(['name', 'age']),
    });

    const { result } = renderHook(() => useSetColumnVisibility<TData>());

    act(() => {
      result.current({ columnKey: 'name', isVisible: true });
    });

    expect(mockColumnsStore.set).toHaveBeenCalledWith(
      expect.objectContaining({ columnVisibility: new Set(['age']) }),
    );
  });

  it('is a no-op for static columns', () => {
    const { result } = renderHook(() => useSetColumnVisibility<TData>());

    act(() => {
      result.current({ columnKey: 'id', isVisible: false });
    });

    expect(mockPersistTableState).not.toHaveBeenCalled();
    expect(mockColumnsStore.set).not.toHaveBeenCalled();
    expect(mockMetaStore.set).not.toHaveBeenCalled();
  });

  it('does not commit when persistence fails', () => {
    mockPersistTableState.mockReturnValueOnce(false);

    const { result } = renderHook(() => useSetColumnVisibility<TData>());

    act(() => {
      result.current({ columnKey: 'name', isVisible: false });
    });

    expect(mockColumnsStore.set).not.toHaveBeenCalled();
    expect(mockMetaStore.set).not.toHaveBeenCalled();
  });
});
