// @vitest-environment jsdom

import { createTableConfigColumnsActionMocks } from '@lcabrera/ui/utils/tests/createTableConfigColumnsActionMocks.util';
import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

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

import { useSetColumnSizing } from './useSetColumnSizing.hook';

const renderAction = () =>
  renderHook(() => useSetColumnSizing<{ readonly name: string }>());

describe('useSetColumnSizing', () => {
  beforeEach(() => {
    setColumnsState(createInitialColumnsState());
    resetMocks();
    vi.clearAllMocks();
  });

  it('writes the width and persists it, so callers never pair it with a sync', () => {
    const { result } = renderAction();

    act(() => {
      result.current({ columnKey: 'name', width: 220 });
    });

    expect(mockWriteColumnSizing).toHaveBeenCalledWith({
      columnKey: 'name',
      columnsStore: mockColumnsStore,
      width: 220,
    });
    expect(mockPersistColumnSizing).toHaveBeenCalledTimes(1);
  });

  it('persists a reset to the default width too', () => {
    const { result } = renderAction();

    act(() => {
      result.current({ columnKey: 'name', width: undefined });
    });

    expect(mockWriteColumnSizing).toHaveBeenCalledWith({
      columnKey: 'name',
      columnsStore: mockColumnsStore,
      width: undefined,
    });
    expect(mockPersistColumnSizing).toHaveBeenCalledTimes(1);
  });

  it('writes before it persists, so the sync sees the new width', () => {
    const { result } = renderAction();

    act(() => {
      result.current({ columnKey: 'name', width: 220 });
    });

    expect(mockWriteColumnSizing.mock.invocationCallOrder[0]).toBeLessThan(
      mockPersistColumnSizing.mock.invocationCallOrder[0] ?? 0,
    );
  });
});
