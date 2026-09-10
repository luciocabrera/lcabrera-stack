// @vitest-environment jsdom

import { act, renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vite-plus/test';

import type { TableGroupingState } from '#ui/components/Table/Table.types';

const groupingStore = {
  get: vi.fn(),
  set: vi.fn(),
};

vi.mock('../useTableDrawerContextValue.hook', () => ({
  useTableDrawerContextValue: () => ({ groupingStore }),
}));

import { useClearColumnAggregates } from './useClearColumnAggregates.hook';

const groupingWithAxis: TableGroupingState = {
  aggregates: [{ columnKey: 'total_amount', fn: 'sum' }],
  columnAxis: 'order_status',
  keys: ['region'],
  mode: 'flat',
  periods: {},
  shares: [{ columnKey: 'total_amount', fn: 'sum' }],
  totalsPlacement: 'last',
};

describe('useClearColumnAggregates', () => {
  it('keeps the staged column axis while clearing measures', () => {
    groupingStore.get.mockReturnValue(groupingWithAxis);
    groupingStore.set.mockClear();

    const { result } = renderHook(() => useClearColumnAggregates());

    act(() => {
      result.current();
    });

    expect(groupingStore.set).toHaveBeenCalledExactlyOnceWith({
      aggregates: [],
      columnAxis: 'order_status',
      keys: ['region'],
      mode: 'flat',
      periods: {},
      shares: [],
      totalsPlacement: 'last',
    });
  });
});
