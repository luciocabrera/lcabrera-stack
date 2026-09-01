import { describe, expect, it } from 'vite-plus/test';

import { resolveAggregateAlias } from './resolve-aggregate-alias.util.ts';

describe('resolveAggregateAlias', () => {
  it('names a bare count after the rows, not a column', () => {
    expect(resolveAggregateAlias({ fn: 'count' })).toBe('count_rows');
  });

  it.each([
    { alias: 'avg_total_amount', fn: 'avg' },
    { alias: 'bool_and_total_amount', fn: 'boolAnd' },
    { alias: 'bool_or_total_amount', fn: 'boolOr' },
    { alias: 'count_total_amount', fn: 'count' },
    { alias: 'max_total_amount', fn: 'max' },
    { alias: 'min_total_amount', fn: 'min' },
    { alias: 'sum_total_amount', fn: 'sum' },
  ] as const)('derives a snake-case alias for $fn', ({ alias, fn }) => {
    expect(resolveAggregateAlias({ column: 'total_amount', fn })).toBe(alias);
  });

  it('keeps count and countDistinct apart on the same column', () => {
    expect(
      resolveAggregateAlias({ column: 'total_amount', fn: 'count' }),
    ).not.toBe(
      resolveAggregateAlias({ column: 'total_amount', fn: 'countDistinct' }),
    );
    expect(
      resolveAggregateAlias({ column: 'total_amount', fn: 'countDistinct' }),
    ).toBe('count_distinct_total_amount');
  });

  it('keeps two different functions apart on the same column', () => {
    const aliases = (['avg', 'max', 'min', 'sum'] as const).map((fn) =>
      resolveAggregateAlias({ column: 'total_amount', fn }),
    );

    expect(new Set(aliases).size).toBe(aliases.length);
  });

  it('lets an explicit alias win, which is the escape hatch for a long column', () => {
    expect(
      resolveAggregateAlias({
        alias: 'revenue',
        column: 'total_amount',
        fn: 'sum',
      }),
    ).toBe('revenue');
  });

  it('derives an alias that is always a safe identifier for a safe column', () => {
    expect(
      resolveAggregateAlias({ column: 'a_b_c', fn: 'countDistinct' }),
    ).toMatch(/^[a-z_][a-z0-9_]*$/);
  });
});
