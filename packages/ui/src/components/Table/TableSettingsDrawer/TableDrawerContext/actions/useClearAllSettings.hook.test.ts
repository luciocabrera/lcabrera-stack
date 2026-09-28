// @vitest-environment jsdom

import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vite-plus/test';

import { drawerColumnsStore } from '#ui/utils/tests/drawerClearActionStores.util';
import '#ui/utils/tests/registerDrawerClearActionMocks';

import { useClearAllSettings } from './useClearAllSettings.hook';

beforeEach(() => {
  drawerColumnsStore.set.mockClear();
});

describe('useClearAllSettings', () => {
  it('empties every column slice and keeps static columns pinned', () => {
    const { result } = renderHook(() => useClearAllSettings());

    act(() => {
      result.current();
    });

    expect(drawerColumnsStore.set).toHaveBeenCalledExactlyOnceWith({
      columnFilters: {},
      columnOrder: [],
      columnPinning: { left: [], right: ['actions'] },
      columnSizing: {},
      columnVisibility: new Set(),
      sorting: [],
    });
  });
});
