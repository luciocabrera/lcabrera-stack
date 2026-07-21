// @vitest-environment jsdom

import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { useResetFilters } from './useResetFilters.hook';

const { configColumnsStore, drawerColumnsStore, setConfigState } = vi.hoisted(
  () => {
    let configState: undefined | { readonly columnFilters?: unknown };

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
  '@lcabrera/ui/components/Table/contexts/TableConfig/useTableConfigContextValue.hook',
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

describe('useResetFilters', () => {
  it('restores the filters from the table config state', () => {
    setConfigState({
      columnFilters: {
        status: { operator: 'equals', type: 'text', value: 'open' },
      },
    });

    const { result } = renderHook(() => useResetFilters());

    act(() => {
      result.current();
    });

    expect(drawerColumnsStore.set).toHaveBeenCalledExactlyOnceWith({
      columnFilters: {
        status: { operator: 'equals', type: 'text', value: 'open' },
      },
    });
  });

  it('falls back to empty filters when config state is absent', () => {
    const { result } = renderHook(() => useResetFilters());

    act(() => {
      result.current();
    });

    expect(drawerColumnsStore.set).toHaveBeenCalledExactlyOnceWith({
      columnFilters: {},
    });
  });
});
