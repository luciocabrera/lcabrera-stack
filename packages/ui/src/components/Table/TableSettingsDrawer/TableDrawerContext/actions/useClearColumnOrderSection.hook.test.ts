// @vitest-environment jsdom

import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vite-plus/test';

import { useClearColumnOrderSection } from './useClearColumnOrderSection.hook';

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

describe('useClearColumnOrderSection', () => {
  it('resets visibility to empty and restores the config pinning default', () => {
    setConfigState({ columnPinning: { left: ['id'], right: ['actions'] } });

    const { result } = renderHook(() => useClearColumnOrderSection());

    act(() => {
      result.current();
    });

    expect(drawerColumnsStore.set).toHaveBeenCalledExactlyOnceWith({
      columnPinning: { left: ['id'], right: ['actions'] },
      columnVisibility: new Set(),
    });
  });

  it('falls back to empty pinning when the config has none', () => {
    const { result } = renderHook(() => useClearColumnOrderSection());

    act(() => {
      result.current();
    });

    expect(drawerColumnsStore.set).toHaveBeenCalledExactlyOnceWith({
      columnPinning: { left: [], right: [] },
      columnVisibility: new Set(),
    });
  });
});
