import { resolveFromCacheOrFetch } from '@lcabrera/ui/utils/prefetch/resolveFromCacheOrFetch.util';
import { describe, expect, it, vi } from 'vite-plus/test';

import { fetchMoreResponse } from './fetchMoreResponse.util';

vi.mock('@lcabrera/ui/utils/prefetch/resolveFromCacheOrFetch.util', () => ({
  resolveFromCacheOrFetch: vi.fn(),
}));

const resolveFromCacheOrFetchMock = vi.mocked(resolveFromCacheOrFetch);

type TestResponse = {
  readonly rows: readonly string[];
  readonly total: number;
};

const requiredOnLoadMore = vi.fn(() =>
  Promise.resolve({ rows: ['a'], total: 1 } as TestResponse),
);

const prefetchRef = {
  current: { data: undefined, promise: undefined, skip: -1 },
};

describe('fetchMoreResponse', () => {
  it('calls resolveFromCacheOrFetch with the correct cache and expectedSkip', async () => {
    resolveFromCacheOrFetchMock.mockResolvedValue({
      rows: ['a'],
      total: 1,
    } as TestResponse);

    await fetchMoreResponse({
      currentDataLength: 3,
      pageSize: 50,
      prefetchRef,
      requiredOnLoadMore,
    });

    expect(resolveFromCacheOrFetchMock).toHaveBeenCalledOnce();
    expect(resolveFromCacheOrFetchMock).toHaveBeenCalledWith(
      expect.objectContaining({
        cache: prefetchRef.current,
        expectedSkip: 3,
      }),
    );
  });

  it('fetchFn calls requiredOnLoadMore with limit and skip derived from currentDataLength', async () => {
    let capturedFetchFn: (() => Promise<TestResponse>) | undefined;

    resolveFromCacheOrFetchMock.mockImplementation(async ({ fetchFn }) => {
      capturedFetchFn = fetchFn as () => Promise<TestResponse>;
      return (fetchFn as () => Promise<TestResponse>)();
    });

    await fetchMoreResponse({
      currentDataLength: 7,
      pageSize: 25,
      prefetchRef,
      requiredOnLoadMore,
    });

    expect(capturedFetchFn).toBeDefined();
    expect(requiredOnLoadMore).toHaveBeenCalledWith({ limit: 25, skip: 7 });
  });

  it('returns the resolved value from resolveFromCacheOrFetch', async () => {
    const expected: TestResponse = { rows: ['x'], total: 10 };

    resolveFromCacheOrFetchMock.mockResolvedValue(expected);

    const result = await fetchMoreResponse({
      currentDataLength: 0,
      pageSize: 50,
      prefetchRef,
      requiredOnLoadMore,
    });

    expect(result).toEqual(expected);
  });
});
