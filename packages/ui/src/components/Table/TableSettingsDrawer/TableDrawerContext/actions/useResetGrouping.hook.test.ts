// @vitest-environment jsdom

import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vite-plus/test';

import { useResetGrouping } from './useResetGrouping.hook';

const { configGroupingStore, drawerGroupingStore, setConfigGrouping } =
  vi.hoisted(() => {
    let grouping: Record<string, unknown> = {
      aggregates: [],
      keys: [],
      mode: 'flat',
      periods: {},
      shares: [],
    };

    return {
      configGroupingStore: { get: vi.fn(() => grouping) },
      drawerGroupingStore: { set: vi.fn() },
      setConfigGrouping: (next: Record<string, unknown>) => {
        grouping = next;
      },
    };
  });

vi.mock(
  '#ui/components/Table/contexts/TableConfig/useTableConfigContextValue.hook',
  () => ({
    useTableConfigContextValue: () => ({ groupingStore: configGroupingStore }),
  }),
);

vi.mock('../useTableDrawerContextValue.hook', () => ({
  useTableDrawerContextValue: () => ({ groupingStore: drawerGroupingStore }),
}));

const resetGrouping = () => {
  const { result } = renderHook(() => useResetGrouping());

  act(() => {
    result.current();
  });
};

beforeEach(() => {
  drawerGroupingStore.set.mockClear();
  setConfigGrouping({
    aggregates: [],
    keys: [],
    mode: 'flat',
    periods: {},
    shares: [],
  });
});

describe('useResetGrouping', () => {
  it('re-seeds the draft from the applied grouping, discarding what was staged', () => {
    setConfigGrouping({
      aggregates: [{ columnKey: 'total_amount', fn: 'sum' }],
      keys: ['region'],
      mode: 'rollup',
      periods: { ordered_at: 'month' },
      shares: [{ columnKey: 'total_amount', fn: 'sum' }],
    });

    resetGrouping();

    expect(drawerGroupingStore.set).toHaveBeenCalledExactlyOnceWith({
      aggregates: [{ columnKey: 'total_amount', fn: 'sum' }],
      keys: ['region'],
      mode: 'rollup',
      periods: { ordered_at: 'month' },
      shares: [{ columnKey: 'total_amount', fn: 'sum' }],
    });
  });

  it('re-seeds an empty grouping rather than leaving the draft alone', () => {
    resetGrouping();

    expect(drawerGroupingStore.set).toHaveBeenCalledExactlyOnceWith({
      aggregates: [],
      keys: [],
      mode: 'flat',
      periods: {},
      shares: [],
    });
  });

  it('reads the applied grouping fresh on every invocation', () => {
    const { result } = renderHook(() => useResetGrouping());

    setConfigGrouping({
      aggregates: [],
      keys: ['region'],
      mode: 'flat',
      periods: {},
      shares: [],
    });
    act(() => {
      result.current();
    });

    setConfigGrouping({
      aggregates: [],
      keys: ['status'],
      mode: 'flat',
      periods: {},
      shares: [],
    });
    act(() => {
      result.current();
    });

    expect(drawerGroupingStore.set).toHaveBeenLastCalledWith({
      aggregates: [],
      keys: ['status'],
      mode: 'flat',
      periods: {},
      shares: [],
    });
  });
});
