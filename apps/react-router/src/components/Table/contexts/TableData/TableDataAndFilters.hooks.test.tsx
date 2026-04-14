// @vitest-environment jsdom

import { createElement } from 'react';
import type { ReactNode } from 'react';

import { act, renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { FiltersDataContext } from '../FiltersData/FiltersDataContext.context';
import type { FiltersDataContextValue } from '../FiltersData/FiltersDataContext.types';
import { useFiltersDataContextValue } from '../FiltersData/useFiltersDataContextValue.hook';
import { useGetFilterData } from '../FiltersData/filters/selectors/useGetFilterData.hook';
import { useFiltersStore } from '../FiltersData/filters/useFiltersStore.hook';
import { TableDataContext } from './TableDataContext.context';
import type { TableDataContextValue } from './TableDataContext.types';
import { useGetTableData } from './data/selectors/useGetTableData.hook';
import { useDataStore } from './data/useDataStore.hook';
import { useTableDataContextValue } from './data/useTableDataContextValue.hook';

type MockStore<TState> = {
  readonly get: () => TState;
  readonly getServerSnapshot: () => TState;
  readonly set: (partial: Partial<TState>) => void;
  readonly subscribe: (listener: () => void) => () => void;
};

type WrapperProps = {
  readonly children: ReactNode;
};

const createMockStore = <TState,>(initialState: TState): MockStore<TState> => {
  let state = initialState;
  const listeners = new Set<() => void>();

  return {
    get: () => state,
    getServerSnapshot: () => state,
    set: (partial) => {
      state = { ...state, ...partial };
      for (const listener of listeners) {
        listener();
      }
    },
    subscribe: (listener) => {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
  };
};

const filtersDataStore = createMockStore({
  status: {
    data: ['Paid'],
    hasMore: false,
    isLoading: false,
    isLoadingMore: false,
    totalLoadedRows: 1,
    totalRows: 1,
  },
});

const dataStore = createMockStore({
  data: [{ id: 1 }],
  hasMore: true,
  isLoading: false,
  isLoadingMore: false,
  totalLoadedRows: 1,
  totalRows: 2,
});

const filtersContextValue: FiltersDataContextValue = {
  filtersDataStore: filtersDataStore as never,
};

const tableDataContextValue: TableDataContextValue<{ readonly id: number }> = {
  dataStore: dataStore as never,
};

const FiltersWrapper = ({ children }: WrapperProps) =>
  createElement(FiltersDataContext, { value: filtersContextValue }, children);

const TableDataWrapper = ({ children }: WrapperProps) =>
  createElement(
    TableDataContext,
    { value: tableDataContextValue as never },
    children,
  );

describe('table data and filters hooks', () => {
  it('returns the filters-data context and selected filter state', () => {
    expect(
      renderHook(() => useFiltersDataContextValue(), {
        wrapper: FiltersWrapper,
      }).result.current,
    ).toBe(filtersContextValue);
    expect(
      renderHook(() => useGetFilterData('status'), { wrapper: FiltersWrapper })
        .result.current,
    ).toEqual({
      data: ['Paid'],
      hasMore: false,
      isLoading: false,
      isLoadingMore: false,
      totalLoadedRows: 1,
      totalRows: 1,
    });
  });

  it('subscribes to filters-store changes', () => {
    const { result } = renderHook(
      () => useFiltersStore<string[]>((state) => state.status?.data ?? []),
      {
        wrapper: FiltersWrapper,
      },
    );

    act(() => {
      filtersDataStore.set({
        status: {
          data: ['Paid', 'Pending'],
          hasMore: false,
          isLoading: false,
          isLoadingMore: false,
          totalLoadedRows: 2,
          totalRows: 2,
        },
      });
    });

    expect(result.current).toEqual(['Paid', 'Pending']);
  });

  it('returns the table-data context and selected table rows', () => {
    expect(
      renderHook(() => useTableDataContextValue(), {
        wrapper: TableDataWrapper,
      }).result.current,
    ).toBe(tableDataContextValue);
    expect(
      renderHook(() => useGetTableData<{ readonly id: number }>(), {
        wrapper: TableDataWrapper,
      }).result.current,
    ).toEqual([{ id: 1 }]);
  });

  it('subscribes to table-data store changes', () => {
    const { result } = renderHook(() => useDataStore((state) => state.data), {
      wrapper: TableDataWrapper,
    });

    act(() => {
      dataStore.set({
        data: [{ id: 1 }, { id: 2 }],
      });
    });

    expect(result.current).toEqual([{ id: 1 }, { id: 2 }]);
  });
});
