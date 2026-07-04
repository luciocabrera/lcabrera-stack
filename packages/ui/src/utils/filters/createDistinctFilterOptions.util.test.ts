import { describe, expect, it, vi } from 'vitest';

import { createDistinctFilterOptions } from './createDistinctFilterOptions.util';

describe('createDistinctFilterOptions', () => {
  it('adapts fetch arguments to the distinct-values contract', async () => {
    const fetchDistinctValues = vi.fn().mockResolvedValue({
      hasMore: true,
      values: ['Pending', 'Shipped'],
    });
    const result = createDistinctFilterOptions<{
      readonly status: string;
    }>({
      columnName: 'status',
      fetchDistinctValues,
    });

    await expect(
      result.fetchFilterOptions({
        limit: 2,
        skip: 4,
      }),
    ).resolves.toEqual({
      hasMore: true,
      values: ['Pending', 'Shipped'],
    });

    expect(fetchDistinctValues).toHaveBeenCalledWith({
      columnName: 'status',
      limit: 2,
      offset: 4,
    });
  });

  it('returns values and total count selectors compatible with the table contract', () => {
    const result = createDistinctFilterOptions<{
      readonly status: string;
    }>({
      columnName: 'status',
      fetchDistinctValues: vi.fn(),
    });
    const response = {
      hasMore: false,
      values: ['Pending', 'Shipped'],
    };

    expect(result.filterOptionsDataSelector(response)).toEqual([
      'Pending',
      'Shipped',
    ]);
    expect(result.filterOptionsDataTotalSelector(response)).toBe(2);
    expect(
      result.filterOptionsDataTotalSelector({
        hasMore: true,
        values: ['Pending'],
      }),
    ).toBe(Infinity);
  });
});
