import { beforeEach, describe, expect, it, vi } from 'vitest';

import { firePrefetch } from '@/utils/prefetch/firePrefetch.util';

import { maybePrefetchNextPage } from './maybePrefetchNextPage.util';

vi.mock('@/utils/prefetch/firePrefetch.util', () => ({
  firePrefetch: vi.fn(),
}));

const firePrefetchMock = vi.mocked(firePrefetch);

type TestResponse = { readonly rows: readonly string[] };

const onLoadMore = vi.fn(() => Promise.resolve({ rows: [] } as TestResponse));

const prefetchRef = {
  current: { data: undefined, promise: undefined, skip: -1 },
};

const baseArgs = {
  enablePrefetch: true,
  hasMore: true,
  nextSkip: 5,
  onLoadMore,
  pageSize: 50,
  prefetchRef,
};

describe('maybePrefetchNextPage', () => {
  beforeEach(() => {
    firePrefetchMock.mockClear();
  });

  it('calls firePrefetch with correct args when enabled and hasMore', () => {
    maybePrefetchNextPage(baseArgs);

    expect(firePrefetchMock).toHaveBeenCalledOnce();
    expect(firePrefetchMock).toHaveBeenCalledWith({
      limit: 50,
      nextSkip: 5,
      onLoadMore,
      prefetchRef,
    });
  });

  it('does nothing when enablePrefetch is false', () => {
    maybePrefetchNextPage({ ...baseArgs, enablePrefetch: false });

    expect(firePrefetchMock).not.toHaveBeenCalled();
  });

  it('does nothing when hasMore is false', () => {
    maybePrefetchNextPage({ ...baseArgs, hasMore: false });

    expect(firePrefetchMock).not.toHaveBeenCalled();
  });

  it('does nothing when both enablePrefetch and hasMore are false', () => {
    maybePrefetchNextPage({
      ...baseArgs,
      enablePrefetch: false,
      hasMore: false,
    });

    expect(firePrefetchMock).not.toHaveBeenCalled();
  });
});
