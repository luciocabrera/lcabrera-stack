// @vitest-environment jsdom

import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vite-plus/test';

import type { ColumnFiltersState } from '#ui/components/Table/Table.types';

import { useSetColumnFilters } from './useSetColumnFilters.hook';

const { drawerColumnsStore } = vi.hoisted(() => ({
  drawerColumnsStore: { set: vi.fn() },
}));

vi.mock('../useTableDrawerContextValue.hook', () => ({
  useTableDrawerContextValue: () => ({ columnsStore: drawerColumnsStore }),
}));

beforeEach(() => {
  drawerColumnsStore.set.mockClear();
});

describe('useSetColumnFilters', () => {
  it('writes the provided column filters into the drawer store', () => {
    const { result } = renderHook(() => useSetColumnFilters());

    const columnFilters: ColumnFiltersState = {
      status: { operator: 'equals', type: 'text', value: 'open' },
    };

    act(() => {
      result.current(columnFilters);
    });

    expect(drawerColumnsStore.set).toHaveBeenCalledExactlyOnceWith({
      columnFilters,
    });
  });
});
