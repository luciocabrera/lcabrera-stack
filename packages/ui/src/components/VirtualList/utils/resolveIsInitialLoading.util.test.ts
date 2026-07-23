import { describe, expect, it } from 'vite-plus/test';

import { resolveIsInitialLoading } from './resolveIsInitialLoading.util';

describe('resolveIsInitialLoading', () => {
  it('returns true while the first load is in flight', () => {
    expect(
      resolveIsInitialLoading({
        hasFetchInitial: false,
        isLoading: true,
        isLoadingMore: false,
        optionsCount: 0,
      }),
    ).toBe(true);
  });

  it('returns true when bootstrapping via onFetchInitial with no data yet', () => {
    expect(
      resolveIsInitialLoading({
        hasFetchInitial: true,
        isLoading: false,
        isLoadingMore: false,
        optionsCount: 0,
      }),
    ).toBe(true);
  });

  it('returns false when options are already loaded', () => {
    expect(
      resolveIsInitialLoading({
        hasFetchInitial: true,
        isLoading: true,
        isLoadingMore: false,
        optionsCount: 3,
      }),
    ).toBe(false);
  });

  it('returns false when empty without loading and without a bootstrap fetch', () => {
    expect(
      resolveIsInitialLoading({
        hasFetchInitial: false,
        isLoading: false,
        isLoadingMore: false,
        optionsCount: 0,
      }),
    ).toBe(false);
  });

  it('returns false while only loading more (pagination)', () => {
    expect(
      resolveIsInitialLoading({
        hasFetchInitial: true,
        isLoading: false,
        isLoadingMore: true,
        optionsCount: 0,
      }),
    ).toBe(false);
  });
});
