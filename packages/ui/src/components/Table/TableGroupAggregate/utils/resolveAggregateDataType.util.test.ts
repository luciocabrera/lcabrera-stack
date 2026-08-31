import { describe, expect, it } from 'vite-plus/test';

import { resolveAggregateDataType } from './resolveAggregateDataType.util';

describe('resolveAggregateDataType', () => {
  it('keeps the column’s type for aggregates that answer in its units', () => {
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
    expect(
      resolveAggregateDataType({ columnDataType: undefined, fn: 'sum' }),
    ).toBe('string');
  });
});
