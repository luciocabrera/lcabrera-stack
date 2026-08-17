import { describe, expect, it } from 'vite-plus/test';

import { resolveAggregateDataType } from './resolveAggregateDataType.util';

describe('resolveAggregateDataType', () => {
  it('keeps the column’s type for aggregates that answer in its units', () => {
    // sum/avg/min/max over money are still money; min/max over a date are
    // still dates.
    expect(
      resolveAggregateDataType({ columnDataType: 'currency', fn: 'sum' }),
    ).toBe('currency');
    expect(
      resolveAggregateDataType({ columnDataType: 'currency', fn: 'avg' }),
    ).toBe('currency');
    expect(
      resolveAggregateDataType({ columnDataType: 'date', fn: 'max' }),
    ).toBe('date');
    expect(
      resolveAggregateDataType({ columnDataType: 'date', fn: 'min' }),
    ).toBe('date');
  });

  it('renders a tally as a number whatever column it sits on', () => {
    // The case that motivates the whole util: a count over a currency column
    // is a row count, and formatting it as currency puts a symbol and two
    // decimals on an integer that has neither.
    expect(
      resolveAggregateDataType({ columnDataType: 'currency', fn: 'count' }),
    ).toBe('number');
    expect(
      resolveAggregateDataType({
        columnDataType: 'currency',
        fn: 'countDistinct',
      }),
    ).toBe('number');
    expect(
      resolveAggregateDataType({ columnDataType: 'date', fn: 'count' }),
    ).toBe('number');
  });

  it('renders a predicate as a boolean whatever column it sits on', () => {
    expect(
      resolveAggregateDataType({ columnDataType: 'number', fn: 'boolAnd' }),
    ).toBe('boolean');
    expect(
      resolveAggregateDataType({ columnDataType: 'string', fn: 'boolOr' }),
    ).toBe('boolean');
  });

  it('falls back to string for an undeclared column', () => {
    // Matching what the cell renderer does with the same absence, so an
    // aggregate and the cells beneath it stay in step even when the consumer
    // declared no `dataType`.
    expect(
      resolveAggregateDataType({ columnDataType: undefined, fn: 'sum' }),
    ).toBe('string');
  });
});
