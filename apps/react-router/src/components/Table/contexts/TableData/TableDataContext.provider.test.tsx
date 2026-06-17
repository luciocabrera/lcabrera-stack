// @vitest-environment jsdom

import { renderHook, waitFor } from '@testing-library/react';
import { type ReactNode } from 'react';
import { describe, expect, it } from 'vitest';

import { useGetTableData } from './data/selectors/useGetTableData.hook';
import { useGetTableHasMore } from './data/selectors/useGetTableHasMore.hook';
import { useGetTableTotalLoadedRows } from './data/selectors/useGetTableTotalLoadedRows.hook';
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
});
