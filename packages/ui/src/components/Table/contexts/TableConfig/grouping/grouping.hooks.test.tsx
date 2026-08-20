// @vitest-environment jsdom
import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vite-plus/test';

import type {
  TableColumnsState,
  TableDataState,
  TableGroupingState,
  TableMetaState,
} from '#ui/components/Table/Table.types';
import type { MockStore } from '#ui/utils/tests/createMockStore.util';

import { MAX_TABLE_GROUP_KEYS } from '#ui/components/Table/Table.constants';
import { createMockStore } from '#ui/utils/tests/createMockStore.util';

const NO_GROUPING: TableGroupingState = {
  aggregates: [],
  keys: [],
  mode: 'flat',
  periods: {},
  shares: [],
};

/**
 * The columns store is here because a grouping change re-derives the column
 * view state: the hierarchy column is a rendering of the grouping
 * configuration, so it appears and disappears with the keys (ADR-065).
 */
const createColumnsState = () =>
  ({
    columnFilters: {},
    columnOrder: [],
    columnPinning: { left: [], right: [] },
    columns: [
      { key: 'order_status', label: 'Status' },
      { key: 'priority', label: 'Priority' },
    ],
    columnSizing: {},
    columnVisibility: new Set<string>(),
    effectiveColumns: [],
    normalizedColumns: {},
    pinnedColumnOffsets: {},
    pinnedColumnPartition: {
      centerCols: [],
      leftPinnedCols: [],
      rightPinnedCols: [],
    },
    sorting: [],
    staticKeys: new Set<string>(),
  }) as unknown as TableColumnsState<Record<string, unknown>>;

const storesRef: {
  columnsStore: MockStore<TableColumnsState<Record<string, unknown>>>;
  dataStore: MockStore<Partial<TableDataState<Record<string, unknown>>>>;
  groupingStore: MockStore<TableGroupingState>;
  metaStore: MockStore<Partial<TableMetaState>>;
} = {
  columnsStore: createMockStore(createColumnsState()),
  dataStore: createMockStore({}),
  groupingStore: createMockStore<TableGroupingState>(NO_GROUPING),
  metaStore: createMockStore<Partial<TableMetaState>>({}),
};

// The same shape `meta.hooks.test.tsx` uses: `vi.hoisted` runs before the
// module body, so the value it returns must be self-contained — it may only
// reference `storesRef` when called, never at hoist time.
const getTableConfigContextValue = vi.hoisted(() => {
  return function getTableConfigContextValue() {
    return {
      columnsStore: storesRef.columnsStore,
      groupingStore: storesRef.groupingStore,
      metaStore: storesRef.metaStore,
    };
  };
});

const getTableDataContextValue = vi.hoisted(() => {
  return function getTableDataContextValue() {
    return { dataStore: storesRef.dataStore };
  };
});

const persistTableState = vi.hoisted(() => vi.fn(() => true));

vi.mock(
  '#ui/components/Table/contexts/TableConfig/useTableConfigContextValue.hook',
  () => ({ useTableConfigContextValue: getTableConfigContextValue }),
);

vi.mock(
  '#ui/components/Table/contexts/TableData/data/useTableDataContextValue.hook',
  () => ({ useTableDataContextValue: getTableDataContextValue }),
);

vi.mock(
  '#ui/components/Table/contexts/TableConfig/columns/actions/hooks/usePersistTableStateAction.hook',
  () => ({ usePersistTableStateAction: () => persistTableState }),
);

import { useAddTableColumnAggregate } from './actions/useAddTableColumnAggregate.hook';
import { useClearTableGrouping } from './actions/useClearTableGrouping.hook';
import { useRemoveTableColumnAggregate } from './actions/useRemoveTableColumnAggregate.hook';
import { useToggleTableGroupKey } from './actions/useToggleTableGroupKey.hook';
import { useGetTableGroupingAggregates } from './selectors/useGetTableGroupingAggregates.hook';
import { useGetTableGroupingKeys } from './selectors/useGetTableGroupingKeys.hook';
import { useGroupingStore } from './useGroupingStore.hook';

describe('TableConfig grouping hooks', () => {
  beforeEach(() => {
    storesRef.columnsStore = createMockStore(createColumnsState());
    storesRef.dataStore = createMockStore({});
    storesRef.groupingStore = createMockStore<TableGroupingState>(NO_GROUPING);
    storesRef.metaStore = createMockStore<Partial<TableMetaState>>({});
    persistTableState.mockClear();
    persistTableState.mockReturnValue(true);
  });

  it('reads the grouping store the config context supplies', () => {
    // The store is taken from the *config* context value, not the data one —
    // this suite mocks only `useTableConfigContextValue` for it, so a slice
    // living on the data context could not resolve here at all.
    const { result } = renderHook(() =>
      useGroupingStore((state) => state.keys),
    );

    expect(result.current).toStrictEqual([]);

    act(() => {
      storesRef.groupingStore.set({ keys: ['order_status'] });
    });

    expect(result.current).toStrictEqual(['order_status']);
  });

  it('exposes the applied keys through the selector hook', () => {
    storesRef.groupingStore.set({ keys: ['priority'] });

    expect(renderHook(() => useGetTableGroupingKeys()).result.current).toEqual([
      'priority',
    ]);
  });

  it('exposes every applied aggregate, in order', () => {
    const applied = [
      { columnKey: 'total_amount', fn: 'sum' },
      { columnKey: 'total_amount', fn: 'avg' },
    ] as const;

    storesRef.groupingStore.set({ aggregates: applied });

    expect(
      renderHook(() => useGetTableGroupingAggregates()).result.current,
    ).toStrictEqual(applied);
  });

  it('hands back the stored array itself, so a re-read is a stable snapshot', () => {
    // Load-bearing: `useSyncExternalStore` compares with `Object.is`, so a
    // selector that built a fresh array per read would re-render forever.
    storesRef.groupingStore.set({
      aggregates: [{ columnKey: 'total_amount', fn: 'sum' }],
    });

    const { rerender, result } = renderHook(() =>
      useGetTableGroupingAggregates(),
    );
    const first = result.current;

    rerender();

    expect(result.current).toBe(first);
  });

  it('writes the grouping param and the store on one interaction', () => {
    const { result } = renderHook(() => useToggleTableGroupKey());

    act(() => {
      result.current({ columnKey: 'order_status' });
    });

    expect(persistTableState).toHaveBeenCalledTimes(1);
    expect(persistTableState).toHaveBeenCalledWith({
      searchParamKey: 'grouping',
      searchParamValue: '{"keys":["order_status"]}',
    });
    expect(storesRef.groupingStore.get().keys).toStrictEqual(['order_status']);
  });

  it('appends a second key rather than replacing the first', () => {
    storesRef.groupingStore.set({ keys: ['order_status'] });

    const { result } = renderHook(() => useToggleTableGroupKey());

    act(() => {
      result.current({ columnKey: 'shipping_country' });
    });

    expect(storesRef.groupingStore.get().keys).toStrictEqual([
      'order_status',
      'shipping_country',
    ]);
    expect(persistTableState).toHaveBeenCalledWith({
      searchParamKey: 'grouping',
      searchParamValue: '{"keys":["order_status","shipping_country"]}',
    });
  });

  it('removes a key that is already applied', () => {
    storesRef.groupingStore.set({ keys: ['order_status', 'shipping_country'] });

    const { result } = renderHook(() => useToggleTableGroupKey());

    act(() => {
      result.current({ columnKey: 'order_status' });
    });

    expect(storesRef.groupingStore.get().keys).toStrictEqual([
      'shipping_country',
    ]);
  });

  it('refuses a key past the configured depth, leaving the store untouched', () => {
    const appliedKeys = Array.from(
      { length: MAX_TABLE_GROUP_KEYS },
      (_, index) => `key_${index}`,
    );
    storesRef.groupingStore.set({ keys: appliedKeys });

    const { result } = renderHook(() => useToggleTableGroupKey());

    act(() => {
      result.current({ columnKey: 'one_too_many' });
    });

    expect(storesRef.groupingStore.get().keys).toStrictEqual(appliedKeys);
    expect(persistTableState).not.toHaveBeenCalled();
  });

  it('applies and clears a column aggregate', () => {
    storesRef.groupingStore.set({ keys: ['order_status'] });

    const { result: add } = renderHook(() => useAddTableColumnAggregate());
    const { result: remove } = renderHook(() =>
      useRemoveTableColumnAggregate(),
    );

    act(() => {
      add.current({ columnKey: 'total_amount', fn: 'sum' });
    });

    expect(storesRef.groupingStore.get().aggregates).toStrictEqual([
      { columnKey: 'total_amount', fn: 'sum' },
    ]);
    expect(persistTableState).toHaveBeenLastCalledWith({
      searchParamKey: 'grouping',
      searchParamValue: '{"agg":["total_amount:sum"],"keys":["order_status"]}',
    });

    act(() => {
      remove.current({ columnKey: 'total_amount' });
    });

    expect(storesRef.groupingStore.get().aggregates).toStrictEqual([]);
    expect(persistTableState).toHaveBeenLastCalledWith({
      searchParamKey: 'grouping',
      searchParamValue: '{"keys":["order_status"]}',
    });
  });

  it('adds a second aggregate to a column that already carries one', () => {
    // The live half of #831: the header menu writes immediately, so it has to
    // append here exactly as the drawer stages.
    storesRef.groupingStore.set({
      aggregates: [{ columnKey: 'total_amount', fn: 'avg' }],
      keys: ['order_status'],
    });

    const { result } = renderHook(() => useAddTableColumnAggregate());

    act(() => {
      result.current({ columnKey: 'total_amount', fn: 'min' });
    });

    expect(storesRef.groupingStore.get().aggregates).toStrictEqual([
      { columnKey: 'total_amount', fn: 'avg' },
      { columnKey: 'total_amount', fn: 'min' },
    ]);
    expect(persistTableState).toHaveBeenLastCalledWith({
      searchParamKey: 'grouping',
      searchParamValue:
        '{"agg":["total_amount:avg","total_amount:min"],"keys":["order_status"]}',
    });
  });

  it('removes one of a column aggregates and leaves the rest', () => {
    storesRef.groupingStore.set({
      aggregates: [
        { columnKey: 'total_amount', fn: 'avg' },
        { columnKey: 'total_amount', fn: 'min' },
      ],
      keys: ['order_status'],
    });

    const { result } = renderHook(() => useRemoveTableColumnAggregate());

    act(() => {
      result.current({ columnKey: 'total_amount', fn: 'avg' });
    });

    expect(storesRef.groupingStore.get().aggregates).toStrictEqual([
      { columnKey: 'total_amount', fn: 'min' },
    ]);
  });

  it('fires one navigation per interaction, not one per re-render', () => {
    // The discriminating part is the re-renders. A URL write driven from the
    // render path (an effect, or a derivation with a side effect in it) would
    // grow this count with every render; one driven from the event handler
    // cannot. Re-rendering between the two clicks is what tells them apart.
    const { rerender, result } = renderHook(() => useToggleTableGroupKey());

    rerender();
    rerender();

    expect(persistTableState).not.toHaveBeenCalled();

    act(() => {
      result.current({ columnKey: 'order_status' });
    });

    expect(persistTableState).toHaveBeenCalledTimes(1);

    rerender();
    rerender();
    rerender();

    expect(persistTableState).toHaveBeenCalledTimes(1);
  });

  it('issues no navigation when the requested state is already applied', () => {
    storesRef.groupingStore.set({
      aggregates: [{ columnKey: 'total_amount', fn: 'sum' }],
      keys: ['order_status'],
      mode: 'flat',
      periods: {},
      shares: [],
    });

    const { result } = renderHook(() => useAddTableColumnAggregate());

    act(() => {
      result.current({ columnKey: 'total_amount', fn: 'sum' });
    });

    expect(persistTableState).not.toHaveBeenCalled();
  });

  it('leaves the store untouched when persistence refuses the write', () => {
    persistTableState.mockReturnValue(false);

    const { result } = renderHook(() => useToggleTableGroupKey());

    act(() => {
      result.current({ columnKey: 'order_status' });
    });

    expect(storesRef.groupingStore.get().keys).toStrictEqual([]);
    expect(storesRef.dataStore.get().isLoading).toBeUndefined();
  });

  it('clears every key and every aggregate, and drops the param', () => {
    storesRef.groupingStore.set({
      aggregates: [{ columnKey: 'total_amount', fn: 'sum' }],
      keys: ['order_status', 'shipping_country'],
      mode: 'flat',
      periods: {},
      shares: [],
    });

    const { result } = renderHook(() => useClearTableGrouping());

    act(() => {
      result.current();
    });

    expect(persistTableState).toHaveBeenCalledWith({
      searchParamKey: 'grouping',
      searchParamValue: undefined,
    });
    expect(storesRef.groupingStore.get()).toStrictEqual(NO_GROUPING);
  });

  it('drops the aggregates when the last key is removed', () => {
    storesRef.groupingStore.set({
      aggregates: [{ columnKey: 'total_amount', fn: 'sum' }],
      keys: ['order_status'],
      mode: 'flat',
      periods: {},
      shares: [],
    });

    const { result } = renderHook(() => useToggleTableGroupKey());

    act(() => {
      result.current({ columnKey: 'order_status' });
    });

    expect(storesRef.groupingStore.get()).toStrictEqual(NO_GROUPING);
  });
});
