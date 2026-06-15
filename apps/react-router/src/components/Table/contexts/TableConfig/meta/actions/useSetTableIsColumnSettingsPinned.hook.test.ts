// @vitest-environment jsdom

import { act, renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

const { metaStoreSetMock } = vi.hoisted(() => ({
  metaStoreSetMock: vi.fn(),
}));

vi.mock('../../useTableConfigContextValue.hook', () => ({
  useTableConfigContextValue: () => ({
    metaStore: {
      set: metaStoreSetMock,
    },
  }),
}));

import { useSetTableIsColumnSettingsPinned } from './useSetTableIsColumnSettingsPinned.hook';

describe('useSetTableIsColumnSettingsPinned', () => {
  it('sets column settings pinned state in meta store', () => {
    const { result } = renderHook(() => useSetTableIsColumnSettingsPinned());

    act(() => {
      result.current(true);
    });

    expect(metaStoreSetMock).toHaveBeenCalledWith({
      isColumnSettingsPinned: true,
    });
  });
});
