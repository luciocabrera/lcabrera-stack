import { describe, expect, it } from 'vite-plus/test';

import { buildWhereClause } from './build-where-clause.util.ts';

describe('buildWhereClause', () => {
  it('returns an empty clause when there are no filters', () => {
    expect(buildWhereClause({ filters: [] })).toEqual({
      nextParamIndex: 1,
      text: '',
      values: [],
    });
  });

  it('returns an empty clause when filters is omitted', () => {
    expect(buildWhereClause({})).toEqual({
      nextParamIndex: 1,
      text: '',
      values: [],
    });
  });

  it('builds a single equality filter with a $1 placeholder', () => {
    const result = buildWhereClause({
      filters: [{ column: 'outcome', operator: 'eq', value: 'capped' }],
    });

    expect(result).toEqual({
      nextParamIndex: 2,
      text: 'WHERE "outcome" = $1',
      values: ['capped'],
    });
  });

  it('increments placeholders across multiple filters', () => {
    const result = buildWhereClause({
      filters: [
        { column: 'outcome', operator: 'eq', value: 'capped' },
        { column: 'created_at', operator: 'gte', value: '2026-01-01' },
      ],
    });

    expect(result).toEqual({
      nextParamIndex: 3,
      text: 'WHERE "outcome" = $1 AND "created_at" >= $2',
      values: ['capped', '2026-01-01'],
    });
  });

  it('honors a non-default startParamIndex', () => {
    const result = buildWhereClause({
      filters: [{ column: 'outcome', operator: 'eq', value: 'capped' }],
      startParamIndex: 5,
    });

    expect(result).toEqual({
      nextParamIndex: 6,
      text: 'WHERE "outcome" = $5',
      values: ['capped'],
    });
  });

  it('rejects an unsafe column name', () => {
    expect(() =>
      buildWhereClause({
        filters: [{ column: 'foo; DROP TABLE x', operator: 'eq', value: 1 }],
      }),
    ).toThrow();
  });

  it('rejects a column not present in an optional allowedColumns list', () => {
    expect(() =>
      buildWhereClause({
        allowedColumns: ['total_cost_usd'],
        filters: [{ column: 'password_hash', operator: 'eq', value: 1 }],
      }),
    ).toThrow();
  });

  it('adds a keyset cursor as one more conjunct, numbered after the filters', () => {
    const result = buildWhereClause({
      cursor: { uniqueColumn: 'order_id', values: [4821] },
      filters: [{ column: 'order_status', operator: 'eq', value: 'Shipped' }],
      sort: [{ column: 'order_id', direction: 'asc' }],
    });

    expect(result).toEqual({
      nextParamIndex: 3,
      text: 'WHERE "order_status" = $1 AND ((("order_id" > $2 OR "order_id" IS NULL)))',
      values: ['Shipped', 4821],
    });
  });

  it('builds a WHERE from a cursor alone when there are no filters', () => {
    const result = buildWhereClause({
      cursor: { uniqueColumn: 'order_id', values: [4821] },
      sort: [{ column: 'order_id', direction: 'asc' }],
    });

    expect(result.text).toBe(
      'WHERE ((("order_id" > $1 OR "order_id" IS NULL)))',
    );
    expect(result.values).toEqual([4821]);
  });

  it('ignores a sort when no cursor asks for one', () => {
    expect(
      buildWhereClause({ sort: [{ column: 'order_id', direction: 'asc' }] }),
    ).toEqual({ nextParamIndex: 1, text: '', values: [] });
  });
});
