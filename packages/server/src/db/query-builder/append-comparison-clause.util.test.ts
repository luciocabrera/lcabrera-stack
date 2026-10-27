import { describe, expect, it } from 'vite-plus/test';

import { appendComparisonClause } from './append-comparison-clause.util.ts';

const EMPTY = { clauses: [], paramIndex: 3, values: [] };

describe('appendComparisonClause', () => {
  it('compares a term to one parameter', () => {
    expect(
      appendComparisonClause({
        accumulator: EMPTY,
        comparison: { operator: 'gte', value: 10 },
        term: 'sum("amount")',
      }),
    ).toEqual({
      clauses: ['sum("amount") >= $3'],
      paramIndex: 4,
      values: [10],
    });
  });

  it('expands IN to one parameter per value', () => {
    expect(
      appendComparisonClause({
        accumulator: EMPTY,
        comparison: { operator: 'in', value: [1, 2] },
        term: '"x"',
      }),
    ).toEqual({ clauses: ['"x" IN ($3, $4)'], paramIndex: 5, values: [1, 2] });
  });

  it('consumes no parameter for a null test', () => {
    expect(
      appendComparisonClause({
        accumulator: EMPTY,
        comparison: { operator: 'isNull' },
        term: '"x"',
      }),
    ).toEqual({ clauses: ['"x" IS NULL'], paramIndex: 3, values: [] });
  });
});
