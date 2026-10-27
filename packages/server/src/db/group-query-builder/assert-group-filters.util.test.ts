import { describe, expect, it } from 'vite-plus/test';

import type { GroupFilter } from './group-query-builder.types.ts';

import { assertGroupFilters } from './assert-group-filters.util.ts';

const OVER_A_THOUSAND: readonly GroupFilter[] = [
  { aggregateAlias: 'sum_amount', operator: 'gt', value: 1000 },
];

const BASE = {
  aggregateAliases: ['count_rows', 'sum_amount'],
  grouping: 'flat' as const,
  hasColumnAxis: false,
};

describe('assertGroupFilters', () => {
  it('accepts a filter on a declared aggregate of a flat read', () => {
    expect(() =>
      assertGroupFilters({ ...BASE, groupFilters: OVER_A_THOUSAND }),
    ).not.toThrow();
  });

  it('accepts no filter under any grouping', () => {
    expect(() =>
      assertGroupFilters({ ...BASE, grouping: 'cube', hasColumnAxis: true }),
    ).not.toThrow();
  });

  it.each(['rollup', 'cube'] as const)('refuses %s', (grouping) => {
    expect(() =>
      assertGroupFilters({ ...BASE, groupFilters: OVER_A_THOUSAND, grouping }),
    ).toThrow(`A group filter is refused with grouping "${grouping}"`);
  });

  it('refuses a column axis even on a flat read', () => {
    expect(() =>
      assertGroupFilters({
        ...BASE,
        groupFilters: OVER_A_THOUSAND,
        hasColumnAxis: true,
      }),
    ).toThrow('A group filter is refused on a read with a column axis');
  });

  it('refuses an alias no aggregate declares', () => {
    expect(() =>
      assertGroupFilters({
        ...BASE,
        groupFilters: [{ aggregateAlias: 'amount', operator: 'isNull' }],
      }),
    ).toThrow('Cannot filter groups by "amount"');
  });

  it.each(['ilike', 'notIlike', 'between'])('refuses %s', (operator) => {
    const groupFilters: readonly GroupFilter[] = JSON.parse(
      `[{"aggregateAlias":"sum_amount","operator":"${operator}","value":1}]`,
    );

    expect(() => assertGroupFilters({ ...BASE, groupFilters })).toThrow(
      `with "${operator}"`,
    );
  });
});
