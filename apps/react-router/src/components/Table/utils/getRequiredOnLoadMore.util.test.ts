import { describe, expect, it } from 'vitest';

import { getRequiredOnLoadMore } from './getRequiredOnLoadMore.util';

describe('getRequiredOnLoadMore', () => {
  it('returns the callback when it is provided', () => {
    const onLoadMore = async () => ({ rows: [], total: 0 });
    expect(getRequiredOnLoadMore(onLoadMore)).toBe(onLoadMore);
  });

  it('throws when onLoadMore is undefined', () => {
    expect(() => getRequiredOnLoadMore(undefined)).toThrowError(
      'onLoadMore callback is required',
    );
  });
});
