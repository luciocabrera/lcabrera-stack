// @vitest-environment jsdom

import { type ReactNode } from 'react';

import { renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';

import { TableDataProvider } from './TableDataContext.provider';
import { useGetTableData } from './data/selectors/useGetTableData.hook';
import { useGetTableHasMore } from './data/selectors/useGetTableHasMore.hook';
import { useGetTableTotalLoadedRows } from './data/selectors/useGetTableTotalLoadedRows.hook';

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
    isPersistenceEnabled
    persistenceKey='orders'
  >
    {children}
  </TableDataProvider>
);

describe('TableDataProvider', () => {
  beforeEach(() => {
    // Clear mocks if needed in future tests
  });

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
});
