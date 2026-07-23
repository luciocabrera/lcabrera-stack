// @vitest-environment jsdom

import { createTableConfigColumnsActionMocks } from '@lcabrera/ui/utils/tests/createTableConfigColumnsActionMocks.util';
import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vite-plus/test';

const createInitialColumnsState = () => ({
  columnPinning: { left: ['id'], right: [] },
  columnSizing: { id: 100 },
  effectiveColumns: [
    { key: 'id', label: 'ID' },
    { key: 'name', label: 'Name' },
  ],
});

const {
  mockColumnsStore,
  mockUseTableConfigContextValue,
  resetMocks,
  setColumnsState,
} = createTableConfigColumnsActionMocks({
  initialColumnsState: createInitialColumnsState(),
  persistenceKey: 'orders-table',
});

const { mockPersistColumnSizing, mockWriteColumnSizing } = vi.hoisted(() => ({
  mockPersistColumnSizing: vi.fn(),
  mockWriteColumnSizing: vi.fn(),
}));

vi.mock(
  '@lcabrera/ui/components/Table/contexts/TableConfig/useTableConfigContextValue.hook',
  () => ({
    useTableConfigContextValue: () => mockUseTableConfigContextValue(),
  }),
);

vi.mock('./utils', async (importOriginal) => {
  const actual = await importOriginal<typeof import('./utils')>();

  return {
    ...actual,
    writeColumnSizing: mockWriteColumnSizing,
  };
});

vi.mock('./hooks/usePersistColumnSizingAction.hook', () => ({
  usePersistColumnSizingAction: () => mockPersistColumnSizing,
}));

import { useSetColumnSizingWithoutSync } from './useSetColumnSizingWithoutSync.hook';

const renderAction = () =>
  renderHook(() => useSetColumnSizingWithoutSync<{ readonly name: string }>());

describe('useSetColumnSizingWithoutSync', () => {
  beforeEach(() => {
    setColumnsState(createInitialColumnsState());
    resetMocks();
    vi.clearAllMocks();
  });

  it('writes the width through the shared util, against the columns store', () => {
    const { result } = renderAction();

    act(() => {
      result.current({ columnKey: 'name', width: 220 });
    });

    expect(mockWriteColumnSizing).toHaveBeenCalledWith({
      columnKey: 'name',
      columnsStore: mockColumnsStore,
      width: 220,
    });
  });

  it('never persists — that is the whole point of this action', () => {
    const { result } = renderAction();

    act(() => {
      result.current({ columnKey: 'name', width: 220 });
      result.current({ columnKey: 'name', width: 240 });
    });

    expect(mockWriteColumnSizing).toHaveBeenCalledTimes(2);
    expect(mockPersistColumnSizing).not.toHaveBeenCalled();
  });
});
