// @vitest-environment jsdom

import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vite-plus/test';

import { drawerColumnsStore } from '#ui/utils/tests/drawerClearActionStores.util';
import '#ui/utils/tests/registerDrawerClearActionMocks';

import { useClearColumnOrderSection } from './useClearColumnOrderSection.hook';

beforeEach(() => {
  drawerColumnsStore.set.mockClear();
});

describe('useClearColumnOrderSection', () => {
  it('empties the order, pinning and visibility and keeps static columns pinned', () => {
    const { result } = renderHook(() => useClearColumnOrderSection());

    act(() => {
      result.current();
    });

    expect(drawerColumnsStore.set).toHaveBeenCalledExactlyOnceWith({
      columnOrder: [],
      columnPinning: { left: [], right: ['actions'] },
      columnVisibility: new Set(),
    });
  });
});
