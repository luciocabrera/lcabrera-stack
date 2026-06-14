import { describe, expect, it } from 'vitest';

import { serializeNumberFilter } from './serializeNumberFilter.util';

describe('serializeNumberFilter', () => {
  it('returns [op, value] for a single number filter', () => {
    expect(
      serializeNumberFilter({
        filter: { operator: 'equals', type: 'number', value: 42 },
      }),
    ).toEqual(['eq', 42]);
  });

  it('returns [op, value, value2] for between', () => {
    expect(
      serializeNumberFilter({
        filter: {
          operator: 'between',
          type: 'number',
          value: 10,
          value2: 20,
        },
      }),
    ).toEqual(['bw', 10, 20]);
  });
});
