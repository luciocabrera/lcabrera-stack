// @vitest-environment jsdom

import type { ReactNode } from 'react';

import { act, renderHook, waitFor } from '@testing-library/react';
import { describe, expect, it } from 'vite-plus/test';

import { useGetTableData } from './data/selectors/useGetTableData.hook';
import { useGetTableHasMore } from './data/selectors/useGetTableHasMore.hook';
import { useGetTableTotalLoadedRows } from './data/selectors/useGetTableTotalLoadedRows.hook';
import { useTableDataContextValue } from './data/useTableDataContextValue.hook';
import { TableDataProvider } from './TableDataContext.provider';

type TestRow = {
  readonly id: number;
};

type WrapperProps = {
  readonly children: ReactNode;
};

const wrapper = ({ children }: WrapperProps) => (
  <TableDataProvider<TestRow>
    dataState={{
      data: [{ id: 1 }],
      isLoading: false,
      isLoadingMore: false,
      totalRows: 3,
    }}
  >
    {children}
  </TableDataProvider>
);

describe('TableDataProvider', () => {
  it('initializes with loader data, not persisted rows', async () => {
    const { result } = renderHook(
      () => ({
        data: useGetTableData<TestRow>(),
        hasMore: useGetTableHasMore(),
        totalLoadedRows: useGetTableTotalLoadedRows(),
      }),
      { wrapper },
    );

    await waitFor(() => {
      expect(result.current).toEqual({
        data: [{ id: 1 }],
        hasMore: true,
        totalLoadedRows: 1,
      });
    });
  });

  it('uses initial dataState when provided', async () => {
    const { result } = renderHook(
      () => ({
        data: useGetTableData<TestRow>(),
        hasMore: useGetTableHasMore(),
        totalLoadedRows: useGetTableTotalLoadedRows(),
      }),
      { wrapper },
    );

    await waitFor(() => {
      expect(result.current).toEqual({
        data: [{ id: 1 }],
        hasMore: true,
        totalLoadedRows: 1,
      });
    });
  });

  it('replaces data when incoming dataState changes without remounting', async () => {
    let currentDataState = {
      data: [{ id: 1 }],
      isLoading: false,
      isLoadingMore: false,
      totalRows: 3,
    };

    const dynamicWrapper = ({ children }: WrapperProps) => (
      <TableDataProvider<TestRow> dataState={currentDataState}>
        {children}
      </TableDataProvider>
    );

    const { rerender, result } = renderHook(
      () => ({
        data: useGetTableData<TestRow>(),
        hasMore: useGetTableHasMore(),
        totalLoadedRows: useGetTableTotalLoadedRows(),
      }),
      { wrapper: dynamicWrapper },
    );

    await waitFor(() => {
      expect(result.current).toEqual({
        data: [{ id: 1 }],
        error: undefined,
        hasMore: true,
        totalLoadedRows: 1,
      });
    });

    currentDataState = {
      data: [{ id: 11 }, { id: 12 }],
      isLoading: false,
      isLoadingMore: false,
      totalRows: 2,
    };

    rerender();

    await waitFor(() => {
      expect(result.current).toEqual({
        data: [{ id: 11 }, { id: 12 }],
        hasMore: false,
        totalLoadedRows: 2,
      });
    });
  });

  it('keeps the pages loaded since, when it re-renders with the same response', async () => {
    const firstPage = [{ id: 1 }];
    const response = { data: firstPage, totalRows: 3 };
    let dataState = { ...response, isLoading: false };

    const dynamicWrapper = ({ children }: WrapperProps) => (
      <TableDataProvider<TestRow> dataState={dataState}>
        {children}
      </TableDataProvider>
    );

    const { rerender, result } = renderHook(
      () => ({
        data: useGetTableData<TestRow>(),
        store: useTableDataContextValue<TestRow>().dataStore,
      }),
      { wrapper: dynamicWrapper },
    );

    await waitFor(() => {
      expect(result.current.data).toEqual(firstPage);
    });

    act(() => {
      result.current.store.set({
        data: [...firstPage, { id: 2 }, { id: 3 }],
        totalLoadedRows: 3,
      });
    });

    dataState = { ...response, isLoading: false };
    rerender();

    await waitFor(() => {
      expect(result.current.data).toEqual([{ id: 1 }, { id: 2 }, { id: 3 }]);
    });
  });
});
