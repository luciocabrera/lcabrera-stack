// @vitest-environment jsdom

import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vite-plus/test';

import { useClearFilters } from './useClearFilters.hook';

const { drawerColumnsStore } = vi.hoisted(() => ({
  drawerColumnsStore: { set: vi.fn() },
}));

vi.mock('../useTableDrawerContextValue.hook', () => ({
  useTableDrawerContextValue: () => ({ columnsStore: drawerColumnsStore }),
}));

beforeEach(() => {
  drawerColumnsStore.set.mockClear();
});

describe('useClearFilters', () => {
  it('empties the drawer column filters when invoked', () => {
    const { result } = renderHook(() => useClearFilters());

    act(() => {
      result.current();
    });

    expect(drawerColumnsStore.set).toHaveBeenCalledExactlyOnceWith({
      columnFilters: {},
    });
  });
});
