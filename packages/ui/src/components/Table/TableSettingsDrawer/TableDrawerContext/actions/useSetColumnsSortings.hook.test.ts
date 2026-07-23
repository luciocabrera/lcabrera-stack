// @vitest-environment jsdom

import type { SortingState } from '@lcabrera/ui/components/Table/Table.types';

import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vite-plus/test';

import { useSetColumnsSortings } from './useSetColumnsSortings.hook';

const { drawerColumnsStore } = vi.hoisted(() => ({
  drawerColumnsStore: { set: vi.fn() },
}));

vi.mock('../useTableDrawerContextValue.hook', () => ({
  useTableDrawerContextValue: () => ({ columnsStore: drawerColumnsStore }),
}));

beforeEach(() => {
  drawerColumnsStore.set.mockClear();
});

describe('useSetColumnsSortings', () => {
  it('stores the sorting state but drops the non-sortable actions column', () => {
    const { result } = renderHook(() => useSetColumnsSortings());

    const sorting: SortingState = [
      { columnKey: 'name', direction: 'asc' },
      { columnKey: 'actions' },
      { columnKey: 'createdAt', direction: 'desc' },
    ];

    act(() => {
      result.current(sorting);
    });

    expect(drawerColumnsStore.set).toHaveBeenCalledExactlyOnceWith({
      sorting: [
        { columnKey: 'name', direction: 'asc' },
        { columnKey: 'createdAt', direction: 'desc' },
      ],
    });
  });
});
