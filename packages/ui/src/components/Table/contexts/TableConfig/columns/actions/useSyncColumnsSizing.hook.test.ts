// @vitest-environment jsdom

import { createTableConfigColumnsActionMocks } from '@repo/ui/utils/tests/createTableConfigColumnsActionMocks.util';
import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const createInitialColumnsState = () => ({
  columnSizing: { name: 220 },
});

const {
  mockColumnsStore,
  mockMetaStore,
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
  '@repo/ui/components/Table/contexts/TableConfig/useTableConfigContextValue.hook',
  () => ({
    useTableConfigContextValue: () => mockUseTableConfigContextValue(),
  }),
);

vi.mock('./utils', async (importOriginal) => {
  const actual = await importOriginal<typeof import('./utils')>();

  return {
    ...actual,
    persistColumnSizing: mockPersistColumnSizing,
    writeColumnSizing: mockWriteColumnSizing,
  };
});

import { useSyncColumnsSizing } from './useSyncColumnsSizing.hook';

describe('useSyncColumnsSizing', () => {
  beforeEach(() => {
    setColumnsState(createInitialColumnsState());
    resetMocks();
    vi.clearAllMocks();
  });

  it('persists the stored widths through the shared util', () => {
    const { result } = renderHook(() =>
      useSyncColumnsSizing<{ readonly name: string }>(),
    );

    act(() => {
      result.current();
    });

    expect(mockPersistColumnSizing).toHaveBeenCalledWith({
      columnsStore: mockColumnsStore,
      metaStore: mockMetaStore,
    });
  });

  it('changes no width of its own', () => {
    const { result } = renderHook(() =>
      useSyncColumnsSizing<{ readonly name: string }>(),
    );

    act(() => {
      result.current();
    });

    expect(mockWriteColumnSizing).not.toHaveBeenCalled();
    expect(mockColumnsStore.set).not.toHaveBeenCalled();
  });
});
