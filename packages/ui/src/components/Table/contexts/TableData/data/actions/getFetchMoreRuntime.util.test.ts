import type { TableMetaState } from '@lcabrera/ui/components/Table/Table.types';

import { LOAD_MORE_PAGE_SIZE } from '@lcabrera/ui/components/Table/Table.constants';
import { describe, expect, it, vi } from 'vitest';

import { getFetchMoreRuntime } from './getFetchMoreRuntime.util';

type TestData = { readonly id: number };
type TestResponse = {
  readonly rows: readonly TestData[];
  readonly total: number;
};

const onLoadMore = vi.fn(() => Promise.resolve({ rows: [], total: 0 }));

describe('getFetchMoreRuntime', () => {
  it('returns empty currentData and defaults when dataState and metaState are undefined', () => {
    const result = getFetchMoreRuntime<TestData, TestResponse>({
      args: { onLoadMore },
      dataState: undefined,
      metaState: undefined,
    });

    expect(result.currentData).toEqual([]);
    expect(result.enablePrefetch).toBe(false);
    expect(result.pageSize).toBe(LOAD_MORE_PAGE_SIZE);
    expect(result.requiredOnLoadMore).toBe(onLoadMore);
  });

  it('returns current data rows from dataState', () => {
    const rows = [{ id: 1 }, { id: 2 }];

    const result = getFetchMoreRuntime<TestData, TestResponse>({
      args: { onLoadMore },
      dataState: {
        data: rows,
        hasMore: true,
        isLoading: false,
        isLoadingMore: false,
        totalLoadedRows: 2,
        totalRows: 5,
      },
      metaState: undefined,
    });

    expect(result.currentData).toEqual(rows);
  });

  it('uses loadMorePageSize from metaState when provided', () => {
    const result = getFetchMoreRuntime<TestData, TestResponse>({
      args: { onLoadMore },
      dataState: undefined,
      metaState: {
        enablePrefetch: false,
        loadMorePageSize: 25,
      } as unknown as TableMetaState,
    });

    expect(result.pageSize).toBe(25);
  });

  it('uses enablePrefetch from metaState when provided', () => {
    const result = getFetchMoreRuntime<TestData, TestResponse>({
      args: { onLoadMore },
      dataState: undefined,
      metaState: {
        enablePrefetch: true,
        loadMorePageSize: 50,
      } as unknown as TableMetaState,
    });

    expect(result.enablePrefetch).toBe(true);
  });

  it('throws when onLoadMore is undefined', () => {
    expect(() =>
      getFetchMoreRuntime<TestData, TestResponse>({
        args: { onLoadMore: undefined },
        dataState: undefined,
        metaState: undefined,
      }),
    ).toThrowError('onLoadMore callback is required');
  });
});
