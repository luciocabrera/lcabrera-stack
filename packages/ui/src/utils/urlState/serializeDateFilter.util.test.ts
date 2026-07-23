import { describe, expect, it } from 'vite-plus/test';

import { serializeDateFilter } from './serializeDateFilter.util';

describe('serializeDateFilter', () => {
  it('returns [op, value] for a single date filter', () => {
    expect(
      serializeDateFilter({
        filter: { operator: 'after', type: 'date', value: '2024-01-15' },
      }),
    ).toEqual(['af', '2024-01-15']);
  });

  it('returns [op, value, value2] for a between date filter', () => {
    expect(
      serializeDateFilter({
        filter: {
          operator: 'between',
          type: 'date',
          value: '2024-01-01',
          value2: '2024-12-31',
        },
      }),
    ).toEqual(['bw', '2024-01-01', '2024-12-31']);
  });

  it('falls back to [op, value] for between without value2', () => {
    expect(
      serializeDateFilter({
        filter: { operator: 'between', type: 'date', value: '2024-01-01' },
      }),
    ).toEqual(['bw', '2024-01-01']);
  });
});
