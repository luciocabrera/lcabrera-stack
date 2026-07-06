import { describe, expect, it, vi } from 'vitest';

import { createDistinctStringColumn } from './createDistinctStringColumn.util';

type Row = {
  city: string;
  id: number;
};

describe('createDistinctStringColumn', () => {
  it('builds a string column with distinct filter adapters', async () => {
    const fetchDistinctValues = vi.fn().mockResolvedValue({
      hasMore: false,
      values: ['Boston', 'Chicago'],
    });

    const result = createDistinctStringColumn<Row>({
      columnName: 'city',
      fetchDistinctValues,
      key: 'city',
      label: 'City',
      maxWidth: 220,
      minWidth: 140,
    });

    const response = await result.fetchFilterOptions?.({
      limit: 10,
      skip: 20,
    });

    expect(result.dataType).toBe('string');
    expect(result.key).toBe('city');
    expect(result.label).toBe('City');
    expect(result.maxWidth).toBe(220);
    expect(result.minWidth).toBe(140);
    expect(fetchDistinctValues).toHaveBeenCalledWith({
      columnName: 'city',
      limit: 10,
      offset: 20,
    });
    expect(response).toStrictEqual({
      hasMore: false,
      values: ['Boston', 'Chicago'],
    });
    expect(result.filterOptionsDataSelector?.(response!)).toStrictEqual([
      'Boston',
      'Chicago',
    ]);
    expect(result.filterOptionsDataTotalSelector?.(response!)).toBe(2);
  });

  it('returns Infinity total when response has more values', () => {
    const fetchDistinctValues = vi.fn();
    const result = createDistinctStringColumn<Row>({
      columnName: 'city',
      fetchDistinctValues,
      key: 'city',
      label: 'City',
      maxWidth: 220,
      minWidth: 140,
    });

    const total = result.filterOptionsDataTotalSelector?.({
      hasMore: true,
      values: ['Boston'],
    });

    expect(total).toBe(Infinity);
  });
});
