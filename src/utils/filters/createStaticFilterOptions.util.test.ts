import { describe, expect, it } from 'vitest';

import { createStaticFilterOptions } from './createStaticFilterOptions.util';

describe('createStaticFilterOptions', () => {
  const values = ['Pending', 'Shipped', 'Delivered'];

  it('returns fetchFilterOptions, filterOptionsDataSelector, filterOptionsDataTotalSelector', () => {
    const result = createStaticFilterOptions(values);
    expect(typeof result.fetchFilterOptions).toBe('function');
    expect(typeof result.filterOptionsDataSelector).toBe('function');
    expect(typeof result.filterOptionsDataTotalSelector).toBe('function');
  });

  it('fetchFilterOptions returns sliced values based on skip/limit', async () => {
    const { fetchFilterOptions } = createStaticFilterOptions(values);
    const result = await fetchFilterOptions!({ limit: 2, skip: 0 });
    expect(result.values).toEqual(['Pending', 'Shipped']);
    expect(result.hasMore).toBe(true);
  });

  it('fetchFilterOptions returns last page with hasMore=false', async () => {
    const { fetchFilterOptions } = createStaticFilterOptions(values);
    const result = await fetchFilterOptions!({ limit: 2, skip: 2 });
    expect(result.values).toEqual(['Delivered']);
    expect(result.hasMore).toBe(false);
  });

  it('filterOptionsDataSelector returns values from response', () => {
    const { filterOptionsDataSelector } = createStaticFilterOptions(values);
    const response = { hasMore: false, values: ['a', 'b'] };
    expect(filterOptionsDataSelector!(response)).toEqual(['a', 'b']);
  });

  it('filterOptionsDataTotalSelector returns Infinity when hasMore=true', () => {
    const { filterOptionsDataTotalSelector } =
      createStaticFilterOptions(values);
    expect(
      filterOptionsDataTotalSelector!({ hasMore: true, values: ['a'] }),
    ).toBe(Infinity);
  });

  it('filterOptionsDataTotalSelector returns values.length when hasMore=false', () => {
    const { filterOptionsDataTotalSelector } =
      createStaticFilterOptions(values);
    expect(
      filterOptionsDataTotalSelector!({
        hasMore: false,
        values: ['a', 'b', 'c'],
      }),
    ).toBe(3);
  });

  it('works with empty values array', async () => {
    const { fetchFilterOptions } = createStaticFilterOptions([]);
    const result = await fetchFilterOptions!({ limit: 10, skip: 0 });
    expect(result.values).toEqual([]);
    expect(result.hasMore).toBe(false);
  });
});
