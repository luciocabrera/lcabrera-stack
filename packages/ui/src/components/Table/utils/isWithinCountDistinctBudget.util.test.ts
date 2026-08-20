import { describe, expect, it } from 'vite-plus/test';

import type { TableColumnAggregate } from '../Table.types';

import { MAX_TABLE_COUNT_DISTINCT_AGGREGATES } from '../Table.constants';
import { isWithinCountDistinctBudget } from './isWithinCountDistinctBudget.util';

/**
 * A list spending exactly the budget — derived from the constant rather than
 * written as one literal entry, so raising the budget re-derives the fixture
 * instead of turning this suite into an assertion about the number 1.
 */
const atBudget: readonly TableColumnAggregate[] = Array.from(
  { length: MAX_TABLE_COUNT_DISTINCT_AGGREGATES },
  (_unused, index) => ({
    columnKey: `column_${index}`,
    fn: 'countDistinct' as const,
  }),
);

describe('isWithinCountDistinctBudget', () => {
  it('accepts a list carrying none', () => {
    expect(
      isWithinCountDistinctBudget([
        { columnKey: 'total_amount', fn: 'sum' },
        { columnKey: 'total_amount', fn: 'count' },
      ]),
    ).toBe(true);
  });

  it('accepts a list carrying exactly the budget', () => {
    expect(isWithinCountDistinctBudget(atBudget)).toBe(true);
  });

  it('refuses one past it, on whatever column', () => {
    // Two different columns: the cap is per read, not per column, which is why
    // no per-column predicate can enforce it (#842).
    expect(
      isWithinCountDistinctBudget([
        ...atBudget,
        { columnKey: 'other_column', fn: 'countDistinct' },
      ]),
    ).toBe(false);
  });

  it('counts only countDistinct, not every aggregate', () => {
    // The discriminating half: a count over the whole list would refuse this,
    // and a column may legitimately carry several measures (#831).
    expect(
      isWithinCountDistinctBudget([
        ...atBudget,
        { columnKey: 'total_amount', fn: 'count' },
        { columnKey: 'total_amount', fn: 'sum' },
        { columnKey: 'total_amount', fn: 'avg' },
      ]),
    ).toBe(true);
  });
});
