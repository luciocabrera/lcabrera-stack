// @vitest-environment jsdom

import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vite-plus/test';

import { useSetTableIsTableSettingsOpen } from './useSetTableIsTableSettingsOpen.hook';

const {
  getMetaState,
  mockUseTableConfigContextValue,
  persistUiFlagsMock,
  setMetaState,
} = vi.hoisted(() => {
  let metaState = {
    isTableSettingsOpen: true,
    persistenceKey: 'orders',
  };

  const mockMetaStore = {
    get: vi.fn(() => metaState),
    set: vi.fn((value: Record<string, unknown>) => {
      metaState = { ...metaState, ...value };
    }),
  };
  const persistUiFlagsMock = vi.fn();

  return {
    getMetaState: () => metaState,
    mockUseTableConfigContextValue: () => ({
      metaStore: mockMetaStore,
    }),
    persistUiFlagsMock,
    setMetaState: (nextState: typeof metaState) => {
      metaState = nextState;
    },
  };
});

vi.mock('./usePersistTableUiFlagsAction.hook', () => ({
  usePersistTableUiFlagsAction: () => persistUiFlagsMock,
}));

vi.mock('../../useTableConfigContextValue.hook', () => ({
  useTableConfigContextValue: mockUseTableConfigContextValue,
}));

describe('useSetTableIsTableSettingsOpen', () => {
  beforeEach(() => {
    persistUiFlagsMock.mockReset();
    setMetaState({
      isTableSettingsOpen: true,
      persistenceKey: 'orders',
    });
  });

  it('stores the open flag when it changes', () => {
    const { result } = renderHook(() => useSetTableIsTableSettingsOpen());

    act(() => {
      result.current(false);
    });

    expect(getMetaState().isTableSettingsOpen).toBe(false);
    expect(persistUiFlagsMock).toHaveBeenCalledTimes(1);
  });

  it('does not write the flag again when it is already the requested value', () => {
    const { result } = renderHook(() => useSetTableIsTableSettingsOpen());

    act(() => {
      result.current(false);
      result.current(false);
    });

    expect(persistUiFlagsMock).toHaveBeenCalledTimes(1);
    expect(getMetaState().isTableSettingsOpen).toBe(false);
  });
});
