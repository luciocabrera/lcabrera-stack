import { describe, expect, it } from 'vitest';

import { clearPrefetchCache } from './clearPrefetchCache.util';

describe('clearPrefetchCache', () => {
  it('resets the prefetch cache ref to its empty initial state', () => {
    const prefetchRef = {
      current: { data: 'some-data', promise: Promise.resolve('p'), skip: 50 },
    };

    clearPrefetchCache({ prefetchRef });

    expect(prefetchRef.current).toEqual({
      data: undefined,
      promise: undefined,
      skip: -1,
    });
  });

  it('accepts a ref that already holds an empty cache without throwing', () => {
    const prefetchRef = {
      current: { data: undefined, promise: undefined, skip: -1 },
    };

    expect(() => clearPrefetchCache({ prefetchRef })).not.toThrow();
    expect(prefetchRef.current).toEqual({
      data: undefined,
      promise: undefined,
      skip: -1,
    });
  });
});
