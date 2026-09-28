// @vitest-environment jsdom

import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vite-plus/test';

import { useClearAllSettings } from './useClearAllSettings.hook';

const { drawerColumnsStore } = vi.hoisted(() => ({
  drawerColumnsStore: { set: vi.fn() },
}));

vi.mock('../useTableDrawerContextValue.hook', () => ({
  useTableDrawerContextValue: () => ({ columnsStore: drawerColumnsStore }),
}));

beforeEach(() => {
  drawerColumnsStore.set.mockClear();
});

describe('useClearAllSettings', () => {
  it('empties every drawer column slice, pinning included', () => {
    const { result } = renderHook(() => useClearAllSettings());

    act(() => {
      result.current();
    });

    expect(drawerColumnsStore.set).toHaveBeenCalledExactlyOnceWith({
      columnFilters: {},
      columnOrder: [],
      columnPinning: { left: [], right: [] },
      columnSizing: {},
      columnVisibility: new Set(),
      sorting: [],
    });
  });
});
