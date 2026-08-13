import { describe, expect, it } from 'vite-plus/test';

import { getInitialDataState } from './getInitialDataState.util';

describe('getInitialDataState', () => {
  it('returns default values', () => {
    const result = getInitialDataState({});
    expect(result.data).toEqual([]);
    expect(result.isLoading).toBe(true);
    expect(result.isLoadingMore).toBe(false);
    expect(result.totalRows).toBe(0);
    expect(result.totalLoadedRows).toBe(0);
    expect(result.hasMore).toBe(false);
  });

  it('computes totalLoadedRows from data.length', () => {
    const result = getInitialDataState({
      data: [{ id: 1 }, { id: 2 }],
      totalRows: 10,
    });
    expect(result.totalLoadedRows).toBe(2);
  });

  it('sets hasMore to true when totalRows > totalLoadedRows', () => {
    const result = getInitialDataState({ data: [{ id: 1 }], totalRows: 100 });
    expect(result.hasMore).toBe(true);
  });

  it('sets hasMore to false when totalRows <= totalLoadedRows', () => {
    const result = getInitialDataState({
      data: [{ id: 1 }, { id: 2 }],
      totalRows: 2,
    });
    expect(result.hasMore).toBe(false);
  });

  it('allows overriding isLoading', () => {
    const result = getInitialDataState({ isLoading: false });
    expect(result.isLoading).toBe(false);
  });

  it('carries the read refusal through so a surface can say why there are no rows', () => {
    const error = {
      column: 'total_amount',
      kind: 'grouping-refused',
      message: 'Column "total_amount" is not a legal group key.',
      reason: 'column-not-groupable',
    } as const;

    expect(getInitialDataState({ error }).error).toBe(error);
  });

  it('names `error` even when the caller omits it, so the store can clear one', () => {
    // The store merges shallowly, so a key omitted here would keep the previous
    // read's refusal — leaving it on screen after the navigation that resolved
    // it. Own-key presence is the assertion, not the value.
    expect(Object.hasOwn(getInitialDataState({}), 'error')).toBe(true);
    expect(getInitialDataState({}).error).toBeUndefined();
  });
});
