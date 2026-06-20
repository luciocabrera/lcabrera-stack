import { describe, expect, it } from 'vitest';

import { getRequiredOnLoadMore } from './getRequiredOnLoadMore.util';

const onLoadMoreMock = async () => ({ rows: [], total: 0 });

describe('getRequiredOnLoadMore', () => {
  it('returns the callback when it is provided', () => {
    expect(getRequiredOnLoadMore(onLoadMoreMock)).toBe(onLoadMoreMock);
  });

  it('throws when onLoadMore is undefined', () => {
    expect(() => getRequiredOnLoadMore(undefined)).toThrowError(
      'onLoadMore callback is required',
    );
  });
});
