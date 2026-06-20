import { describe, expect, it } from 'vitest';

import { createPaginatedFetchActionMocks } from './createPaginatedFetchActionMocks.util';

type TestResponse = {
  readonly rows: readonly string[];
  readonly total: number;
};

const fetchRowsA = async (): Promise<TestResponse> => ({
  rows: ['A'],
  total: 1,
});

const fetchRowsB = async (): Promise<TestResponse> => ({
  rows: ['B'],
  total: 2,
});

describe('createPaginatedFetchActionMocks', () => {
  it('creates stores and prefetch mocks with cache resolution', async () => {
    const harness = createPaginatedFetchActionMocks<
      { readonly data: readonly string[] },
      TestResponse
    >({
      initialDataState: { data: [] },
      initialMetaState: { enablePrefetch: false },
    });

    expect(harness.dataStore.get()).toEqual({ data: [] });
    expect(harness.metaStore.get()).toEqual({ enablePrefetch: false });

    const response = await harness.resolveFromCacheOrFetchMock({
      cache: { data: undefined, promise: undefined, skip: 0 },
      expectedSkip: 0,
      fetchFn: fetchRowsA,
    });

    expect(response).toEqual({ rows: ['A'], total: 1 });
  });

  it('stores resolved prefetch data on the supplied ref', async () => {
    const harness = createPaginatedFetchActionMocks<
      { readonly data: readonly string[] },
      TestResponse
    >({
      initialDataState: { data: [] },
      initialMetaState: { enablePrefetch: false },
    });
    const prefetchRef = harness.createPrefetchRef();
    harness.firePrefetchMock({
      limit: 2,
      nextSkip: 2,
      onLoadMore: fetchRowsB,
      prefetchRef,
    });

    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(prefetchRef.current).toEqual({
      data: { rows: ['B'], total: 2 },
      promise: undefined,
      skip: 2,
    });
  });
});
