import { describe, expect, it } from 'vite-plus/test';

import { buildInsertQuery } from './build-insert-query.util.ts';

// A deliberately non-orders table (inventory.widgets) proves the builder is
// generic — nothing about the enterprise-orders entity leaks into it.
describe('buildInsertQuery', () => {
  it('builds a parameterized INSERT with quoted columns and $n placeholders', () => {
    const result = buildInsertQuery({
      schema: 'inventory',
      table: 'widgets',
      values: { quantity: 5, sku: 'W-1' },
    });

    expect(result).toEqual({
      text: 'INSERT INTO "inventory"."widgets" ("quantity", "sku") VALUES ($1, $2)',
      values: [5, 'W-1'],
    });
  });

  it('appends an explicit RETURNING column projection', () => {
    const result = buildInsertQuery({
      returning: ['widget_id', 'sku'],
      schema: 'inventory',
      table: 'widgets',
      values: { sku: 'W-2' },
    });

    expect(result).toEqual({
      text: 'INSERT INTO "inventory"."widgets" ("sku") VALUES ($1) RETURNING "widget_id", "sku"',
      values: ['W-2'],
    });
  });

  it('supports RETURNING * via the ["*"] wildcard', () => {
    const result = buildInsertQuery({
      returning: ['*'],
      schema: 'inventory',
      table: 'widgets',
      values: { sku: 'W-3' },
    });

    expect(result.text).toBe(
      'INSERT INTO "inventory"."widgets" ("sku") VALUES ($1) RETURNING *',
    );
  });

  it('throws when there are no columns to insert', () => {
    expect(() =>
      buildInsertQuery({ schema: 'inventory', table: 'widgets', values: {} }),
    ).toThrow();
  });

  it('rejects an unsafe schema name', () => {
    expect(() =>
      buildInsertQuery({
        schema: 'inventory; DROP SCHEMA public',
        table: 'widgets',
        values: { sku: 'W' },
      }),
    ).toThrow();
  });

  it('rejects an unsafe table name', () => {
    expect(() =>
      buildInsertQuery({
        schema: 'inventory',
        table: 'widgets; DROP TABLE users',
        values: { sku: 'W' },
      }),
    ).toThrow();
  });

  it('rejects an unsafe column key', () => {
    expect(() =>
      buildInsertQuery({
        schema: 'inventory',
        table: 'widgets',
        values: { 'sku; DROP TABLE users': 'W' },
      }),
    ).toThrow();
  });

  it('rejects a column not present in an optional allowedColumns list', () => {
    expect(() =>
      buildInsertQuery({
        allowedColumns: ['sku'],
        schema: 'inventory',
        table: 'widgets',
        values: { secret_col: 'W' },
      }),
    ).toThrow();
  });
});
