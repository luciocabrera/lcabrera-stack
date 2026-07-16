import { describe, expect, it } from 'vitest';

import { appendFilterClause } from './appendFilterClause.util.ts';

describe('appendFilterClause', () => {
  it('appends an equality clause with a single parameterized value', () => {
    const result = appendFilterClause({
      accumulator: { clauses: [], paramIndex: 1, values: [] },
      filter: { column: 'outcome', operator: 'eq', value: 'capped' },
    });

    expect(result).toEqual({
      clauses: ['"outcome" = $1'],
      paramIndex: 2,
      values: ['capped'],
    });
  });

  it('expands an "in" filter into one placeholder per value', () => {
    const result = appendFilterClause({
      accumulator: { clauses: [], paramIndex: 1, values: [] },
      filter: { column: 'scanner_id', operator: 'in', value: ['a', 'b', 'c'] },
    });

    expect(result).toEqual({
      clauses: ['"scanner_id" IN ($1, $2, $3)'],
      paramIndex: 4,
      values: ['a', 'b', 'c'],
    });
  });

  it('wraps a single non-array value for "in" as a one-element list', () => {
    const result = appendFilterClause({
      accumulator: { clauses: [], paramIndex: 1, values: [] },
      filter: { column: 'scanner_id', operator: 'in', value: 'a' },
    });

    expect(result).toEqual({
      clauses: ['"scanner_id" IN ($1)'],
      paramIndex: 2,
      values: ['a'],
    });
  });

  it('continues incrementing from an existing accumulator', () => {
    const result = appendFilterClause({
      accumulator: {
        clauses: ['"outcome" = $1'],
        paramIndex: 2,
        values: ['capped'],
      },
      filter: { column: 'created_at', operator: 'gte', value: '2026-01-01' },
    });

    expect(result).toEqual({
      clauses: ['"outcome" = $1', '"created_at" >= $2'],
      paramIndex: 3,
      values: ['capped', '2026-01-01'],
    });
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
        allowedColumns: ['total_cost_usd'],
        filter: { column: 'password_hash', operator: 'eq', value: 1 },
      }),
    ).toThrow();
  });
});
