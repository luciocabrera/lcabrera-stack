import { describe, expect, it } from 'vitest';

import { resolveFetchMoreState } from './resolveFetchMoreState.util';

type TestResponse = {
  readonly rows: readonly number[];
  readonly total: number;
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
});
