import { describe, expect, it } from 'vite-plus/test';

import type { NumberFilter } from '#ui/types/filterOperators.types';

import { matchesNumberFilter } from './matchesNumberFilter.util';

const JSON_NULL: unknown = JSON.parse('null');

describe('matchesNumberFilter', () => {
  it('matches every row while the filter is still a draft', () => {
    expect(
      matchesNumberFilter({
        filter: { operator: 'equals', type: 'number', value: undefined },
        value: 1,
      }),
    ).toBe(true);
    expect(
      matchesNumberFilter({
        filter: { operator: 'between', type: 'number', value: 1 },
        value: 99,
      }),
    ).toBe(true);
  });

  it.each([
    { isExpected: true, operator: 'equals', target: 5 },
    { isExpected: false, operator: 'equals', target: 4 },
    { isExpected: true, operator: 'notEquals', target: 4 },
    { isExpected: true, operator: 'greaterThan', target: 4 },
    { isExpected: false, operator: 'greaterThan', target: 5 },
    { isExpected: true, operator: 'greaterThanOrEqual', target: 5 },
    { isExpected: true, operator: 'lessThan', target: 6 },
    { isExpected: false, operator: 'lessThan', target: 5 },
    { isExpected: true, operator: 'lessThanOrEqual', target: 5 },
  ] as const)(
    'applies $operator $target to 5',
    ({ isExpected, operator, target }) => {
      expect(
        matchesNumberFilter({
          filter: { operator, type: 'number', value: target },
          value: 5,
        }),
      ).toBe(isExpected);
    },
  );

  it('includes both bounds of a range', () => {
    const filter: NumberFilter = {
      operator: 'between',
      type: 'number',
      value: 2,
      value2: 4,
    };

    expect(matchesNumberFilter({ filter, value: 2 })).toBe(true);
    expect(matchesNumberFilter({ filter, value: 4 })).toBe(true);
    expect(matchesNumberFilter({ filter, value: 5 })).toBe(false);
  });

  it('reads a numeric string as its number', () => {
    expect(
      matchesNumberFilter({
        filter: { operator: 'equals', type: 'number', value: 5 },
        value: '5',
      }),
    ).toBe(true);
  });

  it('never matches a missing or non-numeric value', () => {
    const filter: NumberFilter = {
      operator: 'notEquals',
      type: 'number',
      value: 1,
    };

    expect(matchesNumberFilter({ filter, value: JSON_NULL })).toBe(false);
    expect(matchesNumberFilter({ filter, value: 'abc' })).toBe(false);
  });
});
