// @vitest-environment jsdom

import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vite-plus/test';

import { useClearColumnOrderSection } from './useClearColumnOrderSection.hook';

const { drawerColumnsStore } = vi.hoisted(() => ({
  drawerColumnsStore: { set: vi.fn() },
}));

vi.mock('../useTableDrawerContextValue.hook', () => ({
  useTableDrawerContextValue: () => ({ columnsStore: drawerColumnsStore }),
}));

beforeEach(() => {
  drawerColumnsStore.set.mockClear();
});

describe('useClearColumnOrderSection', () => {
  it('empties the drawer column order, pinning and visibility when invoked', () => {
    const { result } = renderHook(() => useClearColumnOrderSection());

    act(() => {
      result.current();
    });

    expect(drawerColumnsStore.set).toHaveBeenCalledExactlyOnceWith({
      columnOrder: [],
      columnPinning: { left: [], right: [] },
      columnVisibility: new Set(),
    });
  });
});
