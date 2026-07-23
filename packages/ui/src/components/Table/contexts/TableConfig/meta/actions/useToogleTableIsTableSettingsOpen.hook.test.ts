// @vitest-environment jsdom

import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vite-plus/test';

import { useToogleTableIsColumnSettingsOpen } from './useToogleTableIsColumnSettingsOpen.hook';
import { useToogleTableIsTableSettingsOpen } from './useToogleTableIsTableSettingsOpen.hook';

const { getMetaState, mockUseTableConfigContextValue, setMetaState } =
  vi.hoisted(() => {
    let metaState = {
      isColumnSettingsOpen: false,
      isTableSettingsOpen: false,
    };

    const mockMetaStore = {
      get: vi.fn(() => metaState),
      set: vi.fn((value: Record<string, unknown>) => {
        metaState = { ...metaState, ...value };
      }),
    };

    return {
      getMetaState: () => metaState,
      mockUseTableConfigContextValue: () => ({
        metaStore: mockMetaStore,
      }),
      setMetaState: (nextState: typeof metaState) => {
        metaState = nextState;
      },
    };
  });

vi.mock('../../useTableConfigContextValue.hook', () => ({
  useTableConfigContextValue: mockUseTableConfigContextValue,
}));

vi.mock('./usePersistTableUiFlagsAction.hook', () => ({
  usePersistTableUiFlagsAction: () => vi.fn(),
}));

describe('table settings toggle hooks', () => {
  beforeEach(() => {
    setMetaState({
      isColumnSettingsOpen: false,
      isTableSettingsOpen: false,
    });
  });

  it('toggles table settings using the latest store snapshot', () => {
    const { result } = renderHook(() => useToogleTableIsTableSettingsOpen());

    act(() => {
      result.current();
      expect(getMetaState().isTableSettingsOpen).toBe(true);
      expect(getMetaState().isColumnSettingsOpen).toBe(false);
      result.current();
    });

    expect(getMetaState().isTableSettingsOpen).toBe(false);
  });

  it('toggles column settings using the latest store snapshot', () => {
    const { result } = renderHook(() => useToogleTableIsColumnSettingsOpen());

    act(() => {
      result.current();
      expect(getMetaState().isColumnSettingsOpen).toBe(true);
      expect(getMetaState().isTableSettingsOpen).toBe(false);
      result.current();
    });

    expect(getMetaState().isColumnSettingsOpen).toBe(false);
  });
});
