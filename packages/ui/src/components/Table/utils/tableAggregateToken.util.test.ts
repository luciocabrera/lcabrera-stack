import { describe, expect, it } from 'vite-plus/test';

import {
  parseTableAggregateToken,
  parseTableAggregateTokens,
  toTableAggregateToken,
} from './tableAggregateToken.util';

describe('toTableAggregateToken', () => {
  it('joins the column and the function with a colon', () => {
    expect(
      toTableAggregateToken({ columnKey: 'total_amount', fn: 'sum' }),
    ).toBe('total_amount:sum');
  });

  it('tells two functions on one column apart', () => {
    expect(
      toTableAggregateToken({ columnKey: 'total_amount', fn: 'sum' }),
    ).not.toBe(toTableAggregateToken({ columnKey: 'total_amount', fn: 'avg' }));
  });
});

describe('parseTableAggregateToken', () => {
  it('reads an ordinary token back', () => {
    expect(parseTableAggregateToken('total_amount:sum')).toStrictEqual({
      columnKey: 'total_amount',
      fn: 'sum',
    });
  });

  it('splits on the LAST colon, so a column key may contain one', () => {
    // The discriminating case: a naive `split(':')` reads this as
    // `('odd', 'col')`, refuses it, and passes every other test in this file.
    expect(parseTableAggregateToken('odd:col:sum')).toStrictEqual({
      columnKey: 'odd:col',
      fn: 'sum',
    });
  });

  it('round-trips a column key containing a colon', () => {
    const aggregate = { columnKey: 'a:b:c', fn: 'max' } as const;

    expect(
      parseTableAggregateToken(toTableAggregateToken(aggregate)),
    ).toStrictEqual(aggregate);
  });

  it('refuses a suffix that is not a legal aggregate function', () => {
    expect(parseTableAggregateToken('total_amount:median')).toBeUndefined();
  });

  it('refuses a token with no separator at all', () => {
    expect(parseTableAggregateToken('total_amount')).toBeUndefined();
  });

  it('refuses an empty column key', () => {
    expect(parseTableAggregateToken(':sum')).toBeUndefined();
  });

  it('refuses an empty function', () => {
    expect(parseTableAggregateToken('total_amount:')).toBeUndefined();
  });
});

describe('parseTableAggregateTokens', () => {
  it('reads a whole list in order', () => {
    expect(
      parseTableAggregateTokens(['total_amount:sum', 'total_amount:avg']),
    ).toStrictEqual([
      { columnKey: 'total_amount', fn: 'sum' },
      { columnKey: 'total_amount', fn: 'avg' },
    ]);
  });

  it('refuses the whole list when one token is unreadable', () => {
    // Whole rather than per entry: a half-read list is a configuration nobody
    // asked for (ADR-061).
    expect(
      parseTableAggregateTokens(['total_amount:sum', 'total_amount:median']),
    ).toBeUndefined();
  });

  it('answers an empty list for an empty one', () => {
    expect(parseTableAggregateTokens([])).toStrictEqual([]);
  });
});
