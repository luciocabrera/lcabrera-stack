import { describe, expect, it } from 'vitest';

import { getInitialDataState } from './getInitialDataState.util.ts';

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
});
