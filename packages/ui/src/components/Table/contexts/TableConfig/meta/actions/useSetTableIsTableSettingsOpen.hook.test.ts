// @vitest-environment jsdom

import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vite-plus/test';

import { useSetTableIsTableSettingsOpen } from './useSetTableIsTableSettingsOpen.hook';

const state = vi.hoisted(() => ({
  meta: {
    isTableSettingsOpen: true,
    persistenceKey: 'orders',
  },
  persistUiFlags: vi.fn(),
}));

vi.mock('./usePersistTableUiFlagsAction.hook', () => ({
  usePersistTableUiFlagsAction: () => state.persistUiFlags,
}));

vi.mock('../../useTableConfigContextValue.hook', () => ({
  useTableConfigContextValue: () => ({
    metaStore: {
      get: () => state.meta,
      set: (value: Partial<typeof state.meta>) => {
        state.meta = { ...state.meta, ...value };
      },
    },
  }),
}));

describe('useSetTableIsTableSettingsOpen', () => {
  beforeEach(() => {
    state.persistUiFlags.mockReset();
    state.meta = {
      isTableSettingsOpen: true,
      persistenceKey: 'orders',
    };
  });

  it('stores the open flag when it changes', () => {
    const { result } = renderHook(() => useSetTableIsTableSettingsOpen());

    act(() => {
      result.current(false);
    });

    expect(state.meta.isTableSettingsOpen).toBe(false);
    expect(state.persistUiFlags).toHaveBeenCalledTimes(1);
  });

  it('does not write the flag again when it is already the requested value', () => {
    const { result } = renderHook(() => useSetTableIsTableSettingsOpen());

    act(() => {
      result.current(false);
      result.current(false);
    });

    expect(state.persistUiFlags).toHaveBeenCalledTimes(1);
    expect(state.meta.isTableSettingsOpen).toBe(false);
  });
});
