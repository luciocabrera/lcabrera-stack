import { describe, expect, it } from 'vitest';

import { buildSelectQuery } from './buildSelectQuery.util.ts';

describe('buildSelectQuery', () => {
  it('builds a plain select with explicit fields and no filters/sort/pagination', () => {
    const result = buildSelectQuery({
      fields: ['scanner_id', 'display_name'],
      schema: 'llm_usage',
      table: 'v_scanner_llm_cost',
    });

    expect(result).toEqual({
      text: 'SELECT "scanner_id", "display_name" FROM "llm_usage"."v_scanner_llm_cost"',
      values: [],
    });
  });

  it('composes WHERE, ORDER BY, LIMIT, and OFFSET with correctly incrementing placeholders', () => {
    const result = buildSelectQuery({
      fields: ['scanner_id', 'total_cost_usd'],
      filters: [{ column: 'outcome', operator: 'eq', value: 'capped' }],
      limit: 10,
      offset: 20,
      schema: 'llm_usage',
      sort: [{ column: 'total_cost_usd', direction: 'desc' }],
      table: 'v_scanner_llm_cost',
    });

    expect(result).toEqual({
      text:
        'SELECT "scanner_id", "total_cost_usd" FROM "llm_usage"."v_scanner_llm_cost" ' +
        'WHERE "outcome" = $1 ORDER BY "total_cost_usd" DESC LIMIT $2 OFFSET $3',
      values: ['capped', 10, 20],
    });
  });

  it('rejects an unsafe schema name', () => {
    expect(() =>
      buildSelectQuery({
        fields: ['a'],
        schema: 'llm_usage; DROP SCHEMA cqms',
        table: 't',
      }),
    ).toThrow();
  });

  it('rejects an unsafe table name', () => {
    expect(() =>
      buildSelectQuery({
        fields: ['a'],
        schema: 'llm_usage',
        table: 't; DROP TABLE cqms.users',
      }),
    ).toThrow();
  });

  it('rejects an unsafe field name', () => {
    expect(() =>
      buildSelectQuery({
        fields: ['a; DROP TABLE cqms.users'],
        schema: 'llm_usage',
        table: 'v_scanner_llm_cost',
      }),
    ).toThrow();
  });

  it('rejects a field not present in an optional allowedColumns list', () => {
    expect(() =>
      buildSelectQuery({
        allowedColumns: ['scanner_id'],
        fields: ['password_hash'],
        schema: 'llm_usage',
        table: 'v_scanner_llm_cost',
      }),
    ).toThrow();
  });

  it('allows a field that is present in an optional allowedColumns list', () => {
    expect(() =>
      buildSelectQuery({
        allowedColumns: ['scanner_id'],
        fields: ['scanner_id'],
        schema: 'llm_usage',
        table: 'v_scanner_llm_cost',
      }),
    ).not.toThrow();
  });
});
