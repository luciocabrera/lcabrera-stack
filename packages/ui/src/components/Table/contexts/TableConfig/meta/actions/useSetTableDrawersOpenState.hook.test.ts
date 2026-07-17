// @vitest-environment jsdom

import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { useSetTableDrawersOpenState } from './useSetTableDrawersOpenState.hook';

const {
  getMetaState,
  mockUseTableConfigContextValue,
  persistUiFlagsMock,
  setMetaState,
} = vi.hoisted(() => {
  let metaState = {
    isColumnSettingsOpen: false,
    isTableSettingsOpen: false,
    persistenceKey: 'orders',
    wasTableSettingsOpenBeforeColumnSettings: false,
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

describe('useSetTableDrawersOpenState', () => {
  beforeEach(() => {
    persistUiFlagsMock.mockReset();
    setMetaState({
      isColumnSettingsOpen: false,
      isTableSettingsOpen: false,
      persistenceKey: 'orders',
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
    expect(persistUiFlagsMock).toHaveBeenCalledWith({
      currentState: {
        isColumnSettingsOpen: false,
        isTableSettingsOpen: false,
        persistenceKey: 'orders',
        wasTableSettingsOpenBeforeColumnSettings: false,
      },
      nextStatePatch: {
        isColumnSettingsOpen: true,
        isTableSettingsOpen: false,
        wasTableSettingsOpenBeforeColumnSettings: false,
      },
    });
  });

  it('captures previous table settings open state when opening column settings', () => {
    setMetaState({
      isColumnSettingsOpen: false,
      isTableSettingsOpen: true,
      persistenceKey: 'orders',
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

  it('keeps captured snapshot when switching between column drawers', () => {
    setMetaState({
      isColumnSettingsOpen: true,
      isTableSettingsOpen: false,
      persistenceKey: 'orders',
      wasTableSettingsOpenBeforeColumnSettings: true,
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

  it('preserves existing snapshot when not opening column settings', () => {
    setMetaState({
      isColumnSettingsOpen: true,
      isTableSettingsOpen: false,
      persistenceKey: 'orders',
      wasTableSettingsOpenBeforeColumnSettings: true,
    });

    const { result } = renderHook(() => useSetTableDrawersOpenState());

    act(() => {
      result.current({
        isColumnSettingsOpen: false,
        isTableSettingsOpen: true,
      });
    });

    expect(getMetaState().isColumnSettingsOpen).toBe(false);
    expect(getMetaState().isTableSettingsOpen).toBe(true);
    expect(getMetaState().wasTableSettingsOpenBeforeColumnSettings).toBe(true);
  });

  it('defaults snapshot to false when opening column settings from undefined state', () => {
    setMetaState(undefined as unknown as ReturnType<typeof getMetaState>);

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
});
