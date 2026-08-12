// @vitest-environment jsdom

import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vite-plus/test';

import type { SortingState } from '#ui/components/Table/Table.types';

import { useResetSorting } from './useResetSorting.hook';

const { configColumnsStore, drawerColumnsStore, setConfigState } = vi.hoisted(
  () => {
    let configState: undefined | { readonly sorting?: unknown };

    return {
      configColumnsStore: { get: vi.fn(() => configState) },
      drawerColumnsStore: { set: vi.fn() },
      setConfigState: (next: typeof configState) => {
        configState = next;
      },
    };
  },
);

vi.mock(
  '#ui/components/Table/contexts/TableConfig/useTableConfigContextValue.hook',
  () => ({
    useTableConfigContextValue: () => ({ columnsStore: configColumnsStore }),
  }),
);

vi.mock('../useTableDrawerContextValue.hook', () => ({
  useTableDrawerContextValue: () => ({ columnsStore: drawerColumnsStore }),
}));

beforeEach(() => {
  drawerColumnsStore.set.mockClear();
  setConfigState(undefined);
});

describe('useResetSorting', () => {
  it('restores the sorting from the table config state', () => {
    const sorting: SortingState = [{ columnKey: 'name', direction: 'asc' }];
    setConfigState({ sorting });

    const { result } = renderHook(() => useResetSorting());

    act(() => {
      result.current();
    });

    expect(drawerColumnsStore.set).toHaveBeenCalledExactlyOnceWith({ sorting });
  });

  it('falls back to empty sorting when config state is absent', () => {
    const { result } = renderHook(() => useResetSorting());

    act(() => {
      result.current();
    });

    expect(drawerColumnsStore.set).toHaveBeenCalledExactlyOnceWith({
      sorting: [],
    });
  });
});
