// @vitest-environment jsdom

import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { useSetTableDrawersOpenState } from './useSetTableDrawersOpenState.hook';

const { getMetaState, mockUseTableConfigContextValue, setMetaState } =
  vi.hoisted(() => {
    let metaState = {
      isColumnSettingsOpen: false,
      isTableSettingsOpen: false,
      wasTableSettingsOpenBeforeColumnSettings: false,
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

describe('useSetTableDrawersOpenState', () => {
  beforeEach(() => {
    setMetaState({
      isColumnSettingsOpen: false,
      isTableSettingsOpen: false,
      wasTableSettingsOpenBeforeColumnSettings: false,
    });
  });

  it('sets both drawer open flags in a single mutation', () => {
    const { result } = renderHook(() => useSetTableDrawersOpenState());

    act(() => {
      result.current({
        isColumnSettingsOpen: true,
        isTableSettingsOpen: false,
      });
    });

    expect(getMetaState().isColumnSettingsOpen).toBe(true);
    expect(getMetaState().isTableSettingsOpen).toBe(false);
    expect(getMetaState().wasTableSettingsOpenBeforeColumnSettings).toBe(false);
  });

  it('captures previous table settings open state when opening column settings', () => {
    setMetaState({
      isColumnSettingsOpen: false,
      isTableSettingsOpen: true,
      wasTableSettingsOpenBeforeColumnSettings: false,
    });

    const { result } = renderHook(() => useSetTableDrawersOpenState());

    act(() => {
      result.current({
        isColumnSettingsOpen: true,
        isTableSettingsOpen: false,
      });
    });

    expect(getMetaState().isColumnSettingsOpen).toBe(true);
    expect(getMetaState().isTableSettingsOpen).toBe(false);
    expect(getMetaState().wasTableSettingsOpenBeforeColumnSettings).toBe(true);
  });
});
