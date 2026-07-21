// @vitest-environment jsdom

import { createTableConfigColumnsActionMocks } from '@lcabrera/ui/utils/tests/createTableConfigColumnsActionMocks.util';
import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const createInitialColumnsState = () => ({
  columnSizing: { name: 220 },
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

const { mockPersistColumnSizing } = vi.hoisted(() => ({
  mockPersistColumnSizing: vi.fn(),
}));

vi.mock(
  '@lcabrera/ui/components/Table/contexts/TableConfig/useTableConfigContextValue.hook',
  () => ({
    useTableConfigContextValue: () => mockUseTableConfigContextValue(),
  }),
);

vi.mock('./hooks/usePersistColumnSizingAction.hook', () => ({
  usePersistColumnSizingAction: () => mockPersistColumnSizing,
}));

import { useSyncColumnsSizing } from './useSyncColumnsSizing.hook';

describe('useSyncColumnsSizing', () => {
  beforeEach(() => {
    setColumnsState(createInitialColumnsState());
    resetMocks();
    vi.clearAllMocks();
  });

  it('persists the stored widths through the column-sizing action', () => {
    const { result } = renderHook(() =>
      useSyncColumnsSizing<{ readonly name: string }>(),
    );

    act(() => {
      result.current();
    });

    expect(mockPersistColumnSizing).toHaveBeenCalledTimes(1);
  });

  it('changes no width of its own', () => {
    const { result } = renderHook(() =>
      useSyncColumnsSizing<{ readonly name: string }>(),
    );

    act(() => {
      result.current();
    });

    expect(mockColumnsStore.set).not.toHaveBeenCalled();
  });
});
