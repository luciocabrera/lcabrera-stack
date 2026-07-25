import { describe, expect, it } from 'vite-plus/test';

import { resolveFetchMoreState } from './resolveFetchMoreState.util';

type TestResponse = {
  readonly rows: readonly number[];
  readonly total?: number;
};

describe('resolveFetchMoreState', () => {
  it('appends selected rows and computes hasMore from selector-provided total', () => {
    const result = resolveFetchMoreState<number, TestResponse>({
      currentData: [1, 2],
      currentTotalRows: 2,
      dataSelector: (response) => response.rows,
      dataTotalSelector: (response) => response.total,
      response: {
        rows: [3],
        total: 5,
      },
    });

    expect(result).toEqual({
      combinedData: [1, 2, 3],
      hasMore: true,
      totalLoadedRows: 3,
      totalRows: 5,
    });
  });

  it('falls back to currentTotalRows and no-op appends when no selectors are provided', () => {
    const result = resolveFetchMoreState<number, TestResponse>({
      currentData: [1, 2],
      currentTotalRows: 2,
      response: {
        rows: [3],
        total: 99,
      },
    });

    expect(result).toEqual({
      combinedData: [1, 2],
      hasMore: false,
      totalLoadedRows: 2,
      totalRows: 2,
    });
  });

  it('keeps the total already in the store when a page omits its own', () => {
    const result = resolveFetchMoreState<number, TestResponse>({
      currentData: [1, 2],
      currentTotalRows: 5,
      dataSelector: (response) => response.rows,
      dataTotalSelector: (response) => response.total,
      response: { rows: [3] },
    });

    expect(result).toEqual({
      combinedData: [1, 2, 3],
      hasMore: true,
      totalLoadedRows: 3,
      totalRows: 5,
    });
  });

  it('falls through to the loaded count when a page omits its total and none is known yet', () => {
    const result = resolveFetchMoreState<number, TestResponse>({
      currentData: [],
      dataSelector: (response) => response.rows,
      dataTotalSelector: (response) => response.total,
      response: { rows: [1, 2] },
    });

    expect(result).toEqual({
      combinedData: [1, 2],
      hasMore: false,
      totalLoadedRows: 2,
      totalRows: 2,
    });
  });

  it('keeps a zero total from the selector rather than treating it as absent', () => {
    const result = resolveFetchMoreState<number, TestResponse>({
      currentData: [],
      currentTotalRows: 9,
      dataSelector: (response) => response.rows,
      dataTotalSelector: (response) => response.total,
      response: { rows: [], total: 0 },
    });

    expect(result.totalRows).toBe(0);
    expect(result.hasMore).toBe(false);
  });
});
