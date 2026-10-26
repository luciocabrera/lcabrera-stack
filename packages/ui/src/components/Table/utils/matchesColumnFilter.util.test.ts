import { describe, expect, it } from 'vite-plus/test';

import { matchesColumnFilter } from './matchesColumnFilter.util';

const JSON_NULL: unknown = JSON.parse('null');

describe('matchesColumnFilter', () => {
  it('matches a boolean by value, read through its text', () => {
    const filter = { type: 'boolean', value: true } as const;

    expect(matchesColumnFilter({ filter, value: true })).toBe(true);
    expect(matchesColumnFilter({ filter, value: 'true' })).toBe(true);
    expect(matchesColumnFilter({ filter, value: false })).toBe(false);
    expect(matchesColumnFilter({ filter, value: JSON_NULL })).toBe(false);
  });

  it('tells a null value from a present one for the empty operators', () => {
    const emptyFilter = { operator: 'isEmpty', type: 'empty' } as const;
    const notEmptyFilter = { operator: 'isNotEmpty', type: 'empty' } as const;

    expect(matchesColumnFilter({ filter: emptyFilter, value: JSON_NULL })).toBe(
      true,
    );
    expect(matchesColumnFilter({ filter: emptyFilter, value: '' })).toBe(false);
    expect(matchesColumnFilter({ filter: notEmptyFilter, value: 0 })).toBe(
      true,
    );
    expect(
      matchesColumnFilter({ filter: notEmptyFilter, value: undefined }),
    ).toBe(false);
  });

  it('hands each remaining type to its own matcher', () => {
    expect(
      matchesColumnFilter({
        filter: { operator: 'after', type: 'date', value: '2024-01-01' },
        value: '2024-02-01',
      }),
    ).toBe(true);
    expect(
      matchesColumnFilter({
        filter: { operator: 'lessThan', type: 'number', value: 3 },
        value: 4,
      }),
    ).toBe(false);
    expect(
      matchesColumnFilter({
        filter: { operator: 'contains', type: 'text', value: 'lp' },
        value: 'Alpha',
      }),
    ).toBe(true);
    expect(
      matchesColumnFilter({
        filter: { type: 'select', value: 'open' },
        value: 'closed',
      }),
    ).toBe(false);
  });
});
