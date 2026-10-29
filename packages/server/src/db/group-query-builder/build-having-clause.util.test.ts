import { describe, expect, it } from 'vite-plus/test';

import { buildHavingClause } from './build-having-clause.util.ts';

const EXPRESSIONS = [
  { alias: 'count_rows', expression: 'count(*)' },
  { alias: 'sum_amount', expression: 'sum("amount")' },
];

describe('buildHavingClause', () => {
  it('emits nothing without a filter', () => {
    expect(
      buildHavingClause({ expressions: EXPRESSIONS, startParamIndex: 4 }),
    ).toEqual({ nextParamIndex: 4, text: '', values: [] });
  });

  it('writes each aggregate expression again and parameterizes the value', () => {
    expect(
      buildHavingClause({
        expressions: EXPRESSIONS,
        groupFilters: [
          { aggregateAlias: 'sum_amount', operator: 'lt', value: 50 },
          { aggregateAlias: 'count_rows', operator: 'neq', value: 0 },
        ],
        startParamIndex: 4,
      }),
    ).toEqual({
      nextParamIndex: 6,
      text: 'HAVING sum("amount") < $4 AND count(*) <> $5',
      values: [50, 0],
    });
  });

  it('refuses an alias with no expression', () => {
    expect(() =>
      buildHavingClause({
        expressions: EXPRESSIONS,
        groupFilters: [{ aggregateAlias: 'max_amount', operator: 'isNull' }],
        startParamIndex: 1,
      }),
    ).toThrow('Cannot filter groups by "max_amount"');
  });
});
