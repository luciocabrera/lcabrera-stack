import { describe, expect, it } from 'vite-plus/test';

import { appendFilterClause } from './append-filter-clause.util.ts';

describe('appendFilterClause', () => {
  it('appends an equality clause with a single parameterized value', () => {
    const result = appendFilterClause({
      accumulator: { clauses: [], paramIndex: 1, values: [] },
      filter: { column: 'order_status', operator: 'eq', value: 'Shipped' },
    });

    expect(result).toEqual({
      clauses: ['"order_status" = $1'],
      paramIndex: 2,
      values: ['Shipped'],
    });
  });

  it('expands an "in" filter into one placeholder per value', () => {
    const result = appendFilterClause({
      accumulator: { clauses: [], paramIndex: 1, values: [] },
      filter: { column: 'order_id', operator: 'in', value: ['a', 'b', 'c'] },
    });

    expect(result).toEqual({
      clauses: ['"order_id" IN ($1, $2, $3)'],
      paramIndex: 4,
      values: ['a', 'b', 'c'],
    });
  });

  it('wraps a single non-array value for "in" as a one-element list', () => {
    const result = appendFilterClause({
      accumulator: { clauses: [], paramIndex: 1, values: [] },
      filter: { column: 'order_id', operator: 'in', value: 'a' },
    });

    expect(result).toEqual({
      clauses: ['"order_id" IN ($1)'],
      paramIndex: 2,
      values: ['a'],
    });
  });

  it('renders a "notIlike" filter as a NOT ILIKE clause', () => {
    const result = appendFilterClause({
      accumulator: { clauses: [], paramIndex: 1, values: [] },
      filter: { column: 'title', operator: 'notIlike', value: '%draft%' },
    });

    expect(result).toEqual({
      clauses: ['"title" NOT ILIKE $1'],
      paramIndex: 2,
      values: ['%draft%'],
    });
  });

  it('continues incrementing from an existing accumulator', () => {
    const result = appendFilterClause({
      accumulator: {
        clauses: ['"order_status" = $1'],
        paramIndex: 2,
        values: ['Shipped'],
      },
      filter: { column: 'created_at', operator: 'gte', value: '2026-01-01' },
    });

    expect(result).toEqual({
      clauses: ['"order_status" = $1', '"created_at" >= $2'],
      paramIndex: 3,
      values: ['Shipped', '2026-01-01'],
    });
  });

  it('appends a unary IS NOT NULL clause with no parameter', () => {
    const result = appendFilterClause({
      accumulator: { clauses: [], paramIndex: 1, values: [] },
      filter: { column: 'customer_name', operator: 'isNotNull' },
    });

    expect(result).toEqual({
      clauses: ['"customer_name" IS NOT NULL'],
      paramIndex: 1,
      values: [],
    });
  });

  it('appends a unary IS NULL clause with no parameter', () => {
    const result = appendFilterClause({
      accumulator: { clauses: [], paramIndex: 1, values: [] },
      filter: { column: 'customer_name', operator: 'isNull' },
    });

    expect(result).toEqual({
      clauses: ['"customer_name" IS NULL'],
      paramIndex: 1,
      values: [],
    });
  });

  it('leaves the parameter index untouched, so later filters keep their slots', () => {
    // The property a unary operator can silently break: consuming a `$n` here
    // shifts every following filter's placeholder off its value, which builds a
    // query that runs and compares the wrong columns.
    const afterUnary = appendFilterClause({
      accumulator: { clauses: [], paramIndex: 1, values: [] },
      filter: { column: 'customer_name', operator: 'isNull' },
    });
    const result = appendFilterClause({
      accumulator: afterUnary,
      filter: { column: 'priority', operator: 'eq', value: 'High' },
    });

    expect(result).toEqual({
      clauses: ['"customer_name" IS NULL', '"priority" = $1'],
      paramIndex: 2,
      values: ['High'],
    });
  });

  it('is not the same clause as its negation', () => {
    // `isNull` and `isNotNull` differ by one word and select disjoint row sets,
    // so a copy-paste that emitted one for the other would pass any test that
    // only checked "a clause was appended".
    const isNull = appendFilterClause({
      accumulator: { clauses: [], paramIndex: 1, values: [] },
      filter: { column: 'shipping_country', operator: 'isNull' },
    });
    const isNotNull = appendFilterClause({
      accumulator: { clauses: [], paramIndex: 1, values: [] },
      filter: { column: 'shipping_country', operator: 'isNotNull' },
    });

    expect(isNull.clauses).toEqual(['"shipping_country" IS NULL']);
    expect(isNotNull.clauses).toEqual(['"shipping_country" IS NOT NULL']);
  });

  it('rejects an unsafe column name', () => {
    expect(() =>
      appendFilterClause({
        accumulator: { clauses: [], paramIndex: 1, values: [] },
        filter: { column: 'foo; DROP TABLE x', operator: 'eq', value: 1 },
      }),
    ).toThrow();
  });

  it('rejects a column not present in an optional allowedColumns list', () => {
    expect(() =>
      appendFilterClause({
        accumulator: { clauses: [], paramIndex: 1, values: [] },
        allowedColumns: ['total_amount'],
        filter: { column: 'password_hash', operator: 'eq', value: 1 },
      }),
    ).toThrow();
  });
});
