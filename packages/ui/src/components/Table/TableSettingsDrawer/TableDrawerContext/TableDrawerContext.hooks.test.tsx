// @vitest-environment jsdom

import type { ReactNode } from 'react';

import { act, renderHook } from '@testing-library/react';
import { createElement } from 'react';
import { beforeEach, describe, expect, it } from 'vite-plus/test';

import type {
  TableGroupingState,
  TableMetaState,
} from '#ui/components/Table/Table.types';

import { TableConfigContext } from '#ui/components/Table/contexts/TableConfig/TableConfigContext.context';
import { MAX_TABLE_GROUP_KEYS } from '#ui/components/Table/Table.constants';
import { createMockStore } from '#ui/utils/tests/createMockStore.util';

import type {
  TableDrawerContextValue,
  TableDrawerTotalsPlacementState,
} from './TableDrawerContext.types';

import { useAddColumnAggregate } from './actions/useAddColumnAggregate.hook';
import { useClearGrouping } from './actions/useClearGrouping.hook';
import { useSetColumnsOrder } from './actions/useSetColumnsOrder.hook';
import { useSetGroupKeys } from './actions/useSetGroupKeys.hook';
import { useToggleGroupKey } from './actions/useToggleGroupKey.hook';
import { useGetColumnFilters } from './selectors/useGetColumnFilters.hook';
import { useGetColumnOrder } from './selectors/useGetColumnOrder.hook';
import { useGetColumnPinning } from './selectors/useGetColumnPinning.hook';
import { useGetColumnsSorting } from './selectors/useGetColumnsSorting.hook';
import { useGetColumnVisibility } from './selectors/useGetColumnVisibility.hook';
import { useGetGroupingAggregates } from './selectors/useGetGroupingAggregates.hook';
import { useGetGroupingKeys } from './selectors/useGetGroupingKeys.hook';
import { TableDrawerContext } from './TableDrawerContext.context';
import { useColumnsStore } from './useColumnsStore.hook';
import { useTableDrawerContextValue } from './useTableDrawerContextValue.hook';

type WrapperProps = {
  readonly children: ReactNode;
};

const columnsStore = createMockStore({
  columnFilters: {
    status: {
      operator: 'equals',
      type: 'select',
      value: 'paid',
    },
  },
  columnOrder: ['id', 'status'],
  columnPinning: { left: ['id'], right: [] },
  columnVisibility: new Set(['status']),
  sorting: [{ columnKey: 'status', direction: 'asc' }],
});

const groupingStore = createMockStore<TableGroupingState>({
  aggregates: [],
  keys: [],
  mode: 'flat',
  periods: {},
  shares: [],
});

const totalsPlacementStore = createMockStore<TableDrawerTotalsPlacementState>({
  totalsPlacement: 'last',
});

const contextValue: TableDrawerContextValue = {
  columnsStore: columnsStore as never,
  groupingStore: groupingStore as never,
  totalsPlacementStore: totalsPlacementStore as never,
};

// The drawer only ever mounts inside `TableConfigProvider`, and its grouping
// actions read the reader's preferred mode off the meta store, so the harness
// nests the two the way the app does.
const metaStore = createMockStore<Partial<TableMetaState>>({});

const Wrapper = ({ children }: WrapperProps) =>
  createElement(
    TableConfigContext,
    { value: { metaStore } as never },
    createElement(TableDrawerContext, { value: contextValue }, children),
  );

describe('TableDrawerContext hooks', () => {
  it('returns the drawer context value', () => {
    expect(
      renderHook(() => useTableDrawerContextValue(), { wrapper: Wrapper })
        .result.current,
    ).toBe(contextValue);
  });

  it('subscribes to the drawer store and exposes selector hooks', () => {
    expect(
      renderHook(() => useColumnsStore((state) => state.columnOrder), {
        wrapper: Wrapper,
      }).result.current,
    ).toEqual(['id', 'status']);
    expect(
      renderHook(() => useGetColumnFilters(), { wrapper: Wrapper }).result
        .current,
    ).toEqual({
      status: {
        operator: 'equals',
        type: 'select',
        value: 'paid',
      },
    });
    expect(
      renderHook(() => useGetColumnOrder(), { wrapper: Wrapper }).result
        .current,
    ).toEqual(['id', 'status']);
    expect(
      renderHook(() => useGetColumnPinning(), { wrapper: Wrapper }).result
        .current,
    ).toEqual({
      left: ['id'],
      right: [],
    });
    expect(
      renderHook(() => useGetColumnVisibility(), { wrapper: Wrapper }).result
        .current,
    ).toEqual(new Set(['status']));
    expect(
      renderHook(() => useGetColumnsSorting(), { wrapper: Wrapper }).result
        .current,
    ).toEqual([{ columnKey: 'status', direction: 'asc' }]);
  });

  it('updates the column order through the set action', () => {
    const { result } = renderHook(
      () =>
        useSetColumnsOrder<{ readonly id: number; readonly status: string }>(),
      {
        wrapper: Wrapper,
      },
    );

    act(() => {
      result.current(['status', 'id']);
    });

    expect(columnsStore.get().columnOrder).toEqual(['status', 'id']);
  });
});

describe('TableDrawerContext grouping draft hooks', () => {
  beforeEach(() => {
    groupingStore.reset({
      aggregates: [],
      keys: [],
      mode: 'flat',
      periods: {},
      shares: [],
    });
    metaStore.reset({});
  });

  it('stages a key list, a reorder and an aggregate without any commit path', () => {
    // The draft store is all these actions can reach — they take no
    // persistence or navigation dependency at all, which is what the
    // component-level count test in GroupingSection asserts from the outside.
    const { result: toggle } = renderHook(() => useToggleGroupKey(), {
      wrapper: Wrapper,
    });
    const { result: setKeys } = renderHook(() => useSetGroupKeys(), {
      wrapper: Wrapper,
    });
    const { result: addAggregate } = renderHook(() => useAddColumnAggregate(), {
      wrapper: Wrapper,
    });

    act(() => {
      toggle.current({ columnKey: 'status' });
      toggle.current({ columnKey: 'country' });
      setKeys.current(['country', 'status']);
      addAggregate.current({ columnKey: 'total', fn: 'sum' });
    });

    expect(groupingStore.get()).toEqual({
      aggregates: [{ columnKey: 'total', fn: 'sum' }],
      keys: ['country', 'status'],
      mode: 'flat',
      periods: {},
      shares: [],
    });
  });

  it('exposes the staged keys and aggregates through selector hooks', () => {
    const { result } = renderHook(
      () => ({
        aggregates: useGetGroupingAggregates(),
        keys: useGetGroupingKeys(),
        mode: 'flat',
        periods: {},
        shares: [],
      }),
      { wrapper: Wrapper },
    );

    act(() => {
      groupingStore.set({
        aggregates: [{ columnKey: 'total', fn: 'avg' }],
        keys: ['status'],
        mode: 'flat',
        periods: {},
        shares: [],
      });
    });

    expect(result.current.keys).toEqual(['status']);
    expect(result.current.aggregates).toEqual([
      { columnKey: 'total', fn: 'avg' },
    ]);
  });

  it('stages a clear rather than applying one', () => {
    groupingStore.reset({
      aggregates: [{ columnKey: 'total', fn: 'sum' }],
      keys: ['status'],
      mode: 'flat',
      periods: {},
      shares: [],
    });

    const { result } = renderHook(() => useClearGrouping(), {
      wrapper: Wrapper,
    });

    act(() => {
      result.current();
    });

    expect(groupingStore.get()).toEqual({
      aggregates: [],
      keys: [],
      mode: 'flat',
      periods: {},
      shares: [],
    });
  });

  it('refuses an over-deep key list whole, so the draft cannot stage what Accept would reject', () => {
    const stagedKeys = Array.from(
      { length: MAX_TABLE_GROUP_KEYS },
      (_, index) => `key_${index}`,
    );
    groupingStore.reset({
      aggregates: [],
      keys: stagedKeys,
      mode: 'flat',
      periods: {},
      shares: [],
    });

    const { result } = renderHook(() => useToggleGroupKey(), {
      wrapper: Wrapper,
    });

    act(() => {
      result.current({ columnKey: 'one_too_many' });
    });

    expect(groupingStore.get().keys).toStrictEqual(stagedKeys);
  });

  it('drops the staged aggregates with the last staged key', () => {
    groupingStore.reset({
      aggregates: [{ columnKey: 'total', fn: 'sum' }],
      keys: ['status'],
      mode: 'flat',
      periods: {},
      shares: [],
    });

    const { result } = renderHook(() => useSetGroupKeys(), {
      wrapper: Wrapper,
    });

    act(() => {
      result.current([]);
    });

    expect(groupingStore.get()).toEqual({
      aggregates: [],
      keys: [],
      mode: 'flat',
      periods: {},
      shares: [],
    });
  });
});

describe("the reader's preferred grouping mode", () => {
  beforeEach(() => {
    groupingStore.reset({
      aggregates: [],
      keys: [],
      mode: 'flat',
      periods: {},
      shares: [],
    });
    metaStore.reset({ preferredGroupingMode: 'rollup' });
  });

  it('starts a grouping the first staged key creates', () => {
    const { result } = renderHook(() => useToggleGroupKey(), {
      wrapper: Wrapper,
    });

    act(() => {
      result.current({ columnKey: 'status' });
    });

    expect(groupingStore.get().mode).toBe('rollup');
  });

  it('leaves a second key alone, so switching the mode back sticks', () => {
    const { result } = renderHook(() => useToggleGroupKey(), {
      wrapper: Wrapper,
    });

    act(() => {
      result.current({ columnKey: 'status' });
    });

    act(() => {
      groupingStore.set({ mode: 'flat' });
      result.current({ columnKey: 'country' });
    });

    expect(groupingStore.get().mode).toBe('flat');
  });

  it('applies to the Add button path too, not only the toggle', () => {
    const { result } = renderHook(() => useSetGroupKeys(), {
      wrapper: Wrapper,
    });

    act(() => {
      result.current(['status']);
    });

    expect(groupingStore.get().mode).toBe('rollup');
  });

  it('leaves the mode alone when the reader expressed no preference', () => {
    metaStore.reset({});

    const { result } = renderHook(() => useToggleGroupKey(), {
      wrapper: Wrapper,
    });

    act(() => {
      result.current({ columnKey: 'status' });
    });

    expect(groupingStore.get().mode).toBe('flat');
  });
});
