import { describe, expect, it } from 'vite-plus/test';

import type { TableColumnAggregate } from '../Table.types';

import { MAX_TABLE_COUNT_DISTINCT_AGGREGATES } from '../Table.constants';
import { hasCountDistinctBudgetLeft } from './hasCountDistinctBudgetLeft.util';
import { isWithinCountDistinctBudget } from './isWithinCountDistinctBudget.util';

const atBudget: readonly TableColumnAggregate[] = Array.from(
  { length: MAX_TABLE_COUNT_DISTINCT_AGGREGATES },
  (_unused, index) => ({
    columnKey: `column_${index}`,
    fn: 'countDistinct' as const,
  }),
);

describe('hasCountDistinctBudgetLeft', () => {
  it('reports room while nothing has spent it', () => {
    expect(
      hasCountDistinctBudgetLeft([{ columnKey: 'name', fn: 'count' }]),
    ).toBe(true);
  });

  it('reports none once the budget is spent', () => {
    expect(hasCountDistinctBudgetLeft(atBudget)).toBe(false);
  });

  it('disagrees with the legality predicate on a list at the budget', () => {
    expect(hasCountDistinctBudgetLeft(atBudget)).toBe(false);
    expect(isWithinCountDistinctBudget(atBudget)).toBe(true);
  });

  it('counts only countDistinct, not every aggregate', () => {
    expect(
      hasCountDistinctBudgetLeft([
        { columnKey: 'total_amount', fn: 'count' },
        { columnKey: 'total_amount', fn: 'sum' },
      ]),
    ).toBe(true);
  });
});
