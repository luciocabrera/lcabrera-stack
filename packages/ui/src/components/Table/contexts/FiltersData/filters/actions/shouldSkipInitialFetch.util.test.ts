import { describe, expect, it } from 'vite-plus/test';

import { shouldSkipInitialFetch } from './shouldSkipInitialFetch.util';

const baseFilter = {
  hasMore: false,
  isLoadingMore: false,
  totalLoadedRows: 0,
  totalRows: 0,
};

describe('shouldSkipInitialFetch', () => {
  it('returns false when data is empty and not loading', () => {
    expect(
      shouldSkipInitialFetch({
        currentFilter: { ...baseFilter, data: [], isLoading: false },
      }),
    ).toBe(false);
  });

  it('returns true when data already exists', () => {
    expect(
      shouldSkipInitialFetch({
        currentFilter: { ...baseFilter, data: ['a'], isLoading: false },
      }),
    ).toBe(true);
  });

  it('returns true when a fetch is already in progress', () => {
    expect(
      shouldSkipInitialFetch({
        currentFilter: { ...baseFilter, data: [], isLoading: true },
      }),
    ).toBe(true);
  });

  it('returns true when data exists AND loading is true', () => {
    expect(
      shouldSkipInitialFetch({
        currentFilter: { ...baseFilter, data: ['a'], isLoading: true },
      }),
    ).toBe(true);
  });
});
