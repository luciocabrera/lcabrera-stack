import { describe, expect, it } from 'vite-plus/test';

import { clearPrefetchIfPresent } from './clearPrefetchIfPresent.util';

describe('clearPrefetchIfPresent', () => {
  it('resets the prefetch cache when a ref is provided', () => {
    const prefetchRef = {
      current: {
        data: ['cached'],
        promise: Promise.resolve(['cached']),
        skip: 25,
      },
    };

    clearPrefetchIfPresent({ prefetchRef });

    expect(prefetchRef.current).toEqual({
      data: undefined,
      promise: undefined,
      skip: -1,
    });
  });

  it('does nothing when no ref is provided', () => {
    expect(() => {
      clearPrefetchIfPresent({});
    }).not.toThrow();
  });
});
