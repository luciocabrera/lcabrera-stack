// @vitest-environment jsdom

import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vite-plus/test';

import { useClearAllSettings } from './useClearAllSettings.hook';

const { configColumnsStore, drawerColumnsStore, setConfigState } = vi.hoisted(
  () => {
    let configState:
      | undefined
      | {
          readonly columnPinning?: {
            readonly left: readonly string[];
            readonly right: readonly string[];
          };
        };

    return {
      configColumnsStore: { get: vi.fn(() => configState) },
      drawerColumnsStore: { set: vi.fn() },
      setConfigState: (next: typeof configState) => {
        configState = next;
      },
    };
  },
);

vi.mock(
  '#ui/components/Table/contexts/TableConfig/useTableConfigContextValue.hook',
  () => ({
    useTableConfigContextValue: () => ({ columnsStore: configColumnsStore }),
  }),
);

vi.mock('../useTableDrawerContextValue.hook', () => ({
  useTableDrawerContextValue: () => ({ columnsStore: drawerColumnsStore }),
}));

beforeEach(() => {
  drawerColumnsStore.set.mockClear();
  setConfigState(undefined);
});

describe('useClearAllSettings', () => {
  it('clears every slice, preserving the config pinning as the pinning default', () => {
    setConfigState({ columnPinning: { left: ['id'], right: [] } });

    const { result } = renderHook(() => useClearAllSettings());

    act(() => {
      result.current();
    });

    expect(drawerColumnsStore.set).toHaveBeenCalledExactlyOnceWith({
      columnFilters: {},
      columnOrder: [],
      columnPinning: { left: ['id'], right: [] },
      columnSizing: {},
      columnVisibility: new Set(),
      sorting: [],
    });
  });

  it('uses the empty pinning default when config has no pinning', () => {
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
