// @vitest-environment jsdom
import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vite-plus/test';

import type {
  TableDataState,
  TableGroupingState,
} from '#ui/components/Table/Table.types';
import type { MockStore } from '#ui/utils/tests/createMockStore.util';

import { createMockStore } from '#ui/utils/tests/createMockStore.util';

const storesRef: {
  dataStore: MockStore<Partial<TableDataState<Record<string, unknown>>>>;
  groupingStore: MockStore<TableGroupingState>;
} = {
  dataStore: createMockStore({}),
  groupingStore: createMockStore<TableGroupingState>({ keys: [] }),
};

// The same shape `meta.hooks.test.tsx` uses: `vi.hoisted` runs before the
// module body, so the value it returns must be self-contained — it may only
// reference `storesRef` when called, never at hoist time.
const getTableConfigContextValue = vi.hoisted(() => {
  return function getTableConfigContextValue() {
    return { groupingStore: storesRef.groupingStore };
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

import { useSetTableGrouping } from './actions/useSetTableGrouping.hook';
import { useGetTableGroupingKeys } from './selectors/useGetTableGroupingKeys.hook';
import { useGroupingStore } from './useGroupingStore.hook';

describe('TableConfig grouping hooks', () => {
  beforeEach(() => {
    storesRef.dataStore = createMockStore({});
    storesRef.groupingStore = createMockStore<TableGroupingState>({ keys: [] });
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

  it('writes the grouping param and the store on one interaction', () => {
    const { result } = renderHook(() => useSetTableGrouping());

    act(() => {
      result.current('order_status');
    });

    expect(persistTableState).toHaveBeenCalledTimes(1);
    expect(persistTableState).toHaveBeenCalledWith({
      searchParamKey: 'grouping',
      searchParamValue: '{"keys":["order_status"]}',
    });
    expect(storesRef.groupingStore.get().keys).toStrictEqual(['order_status']);
  });

  it('fires one navigation per interaction, not one per re-render', () => {
    // The discriminating part is the re-renders. A URL write driven from the
    // render path (an effect, or a derivation with a side effect in it) would
    // grow this count with every render; one driven from the event handler
    // cannot. Re-rendering between the two clicks is what tells them apart.
    const { rerender, result } = renderHook(() => useSetTableGrouping());

    rerender();
    rerender();

    expect(persistTableState).not.toHaveBeenCalled();

    act(() => {
      result.current('order_status');
    });

    expect(persistTableState).toHaveBeenCalledTimes(1);

    rerender();
    rerender();
    rerender();

    expect(persistTableState).toHaveBeenCalledTimes(1);
  });

  it('issues no navigation when the requested key is already applied', () => {
    storesRef.groupingStore.set({ keys: ['order_status'] });

    const { result } = renderHook(() => useSetTableGrouping());

    act(() => {
      result.current('order_status');
    });

    expect(persistTableState).not.toHaveBeenCalled();
  });

  it('leaves the store untouched when persistence refuses the write', () => {
    persistTableState.mockReturnValue(false);

    const { result } = renderHook(() => useSetTableGrouping());

    act(() => {
      result.current('order_status');
    });

    expect(storesRef.groupingStore.get().keys).toStrictEqual([]);
    expect(storesRef.dataStore.get().isLoading).toBeUndefined();
  });

  it('clears grouping and drops the param', () => {
    storesRef.groupingStore.set({ keys: ['order_status'] });

    const { result } = renderHook(() => useSetTableGrouping());

    act(() => {
      result.current(undefined);
    });

    expect(persistTableState).toHaveBeenCalledWith({
      searchParamKey: 'grouping',
      searchParamValue: undefined,
    });
    expect(storesRef.groupingStore.get().keys).toStrictEqual([]);
  });
});
