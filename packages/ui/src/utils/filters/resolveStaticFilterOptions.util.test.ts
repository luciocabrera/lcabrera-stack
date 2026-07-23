import { describe, expect, it } from 'vite-plus/test';

import { resolveStaticFilterOptions } from './resolveStaticFilterOptions.util';

const descriptor = {
  kind: 'static',
  values: ['Pending', 'Shipped', 'Delivered'],
} as const;

describe('resolveStaticFilterOptions', () => {
  it('serves pages by slicing the baked values', async () => {
    const { onLoadMore } = resolveStaticFilterOptions(descriptor);

    const firstPage = await onLoadMore({ limit: 2, skip: 0 });
    expect(firstPage).toEqual({
      hasMore: true,
      values: ['Pending', 'Shipped'],
    });

    const lastPage = await onLoadMore({ limit: 2, skip: 2 });
    expect(lastPage).toEqual({ hasMore: false, values: ['Delivered'] });
  });

  it('selects values from a response', () => {
    const { dataSelector } = resolveStaticFilterOptions(descriptor);

    expect(dataSelector({ hasMore: false, values: ['a', 'b'] })).toEqual([
      'a',
      'b',
    ]);
  });

  it('keeps the hasMore ? Infinity : length total convention', () => {
    const { dataTotalSelector } = resolveStaticFilterOptions(descriptor);

    expect(dataTotalSelector({ hasMore: true, values: ['a'] })).toBe(Infinity);
    expect(dataTotalSelector({ hasMore: false, values: ['a', 'b'] })).toBe(2);
  });

  it('handles an empty values list', async () => {
    const { onLoadMore } = resolveStaticFilterOptions({
      kind: 'static',
      values: [],
    });

    expect(await onLoadMore({ limit: 10, skip: 0 })).toEqual({
      hasMore: false,
      values: [],
    });
  });
});
