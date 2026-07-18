// @vitest-environment jsdom

import type { ColumnFiltersState } from '@repo/ui/components/Table/Table.types';

import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

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
