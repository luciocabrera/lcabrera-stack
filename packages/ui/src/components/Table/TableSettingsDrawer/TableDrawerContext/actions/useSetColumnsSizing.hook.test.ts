// @vitest-environment jsdom

import type { ColumnSizingState } from '@lcabrera/ui/components/Table/Table.types';

import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vite-plus/test';

import { useSetColumnsSizing } from './useSetColumnsSizing.hook';

const { drawerColumnsStore } = vi.hoisted(() => ({
  drawerColumnsStore: { set: vi.fn() },
}));

vi.mock('../useTableDrawerContextValue.hook', () => ({
  useTableDrawerContextValue: () => ({ columnsStore: drawerColumnsStore }),
}));

beforeEach(() => {
  drawerColumnsStore.set.mockClear();
});

describe('useSetColumnsSizing', () => {
  it('writes the entire column sizing map into the drawer store', () => {
    const { result } = renderHook(() => useSetColumnsSizing());

    const columnSizing: ColumnSizingState = { id: 120, name: 240 };

    act(() => {
      result.current(columnSizing);
    });

    expect(drawerColumnsStore.set).toHaveBeenCalledExactlyOnceWith({
      columnSizing,
    });
  });
});
