import { describe, expect, it } from 'vitest';

import { buildUpdateQuery } from './build-update-query.util.ts';

describe('buildUpdateQuery', () => {
  it('offsets WHERE placeholders after the SET placeholders', () => {
    const result = buildUpdateQuery({
      filters: [{ column: 'widget_id', operator: 'eq', value: 42 }],
      schema: 'inventory',
      table: 'widgets',
      values: { quantity: 3, sku: 'W-9' },
    });

    expect(result).toEqual({
      text: 'UPDATE "inventory"."widgets" SET "quantity" = $1, "sku" = $2 WHERE "widget_id" = $3',
      values: [3, 'W-9', 42],
    });
  });

  it('offsets an IN filter after multiple SET params', () => {
    const result = buildUpdateQuery({
      filters: [{ column: 'status', operator: 'in', value: ['a', 'b'] }],
      schema: 'inventory',
      table: 'widgets',
      values: { quantity: 2, sku: 'W' },
    });

    expect(result).toEqual({
      text: 'UPDATE "inventory"."widgets" SET "quantity" = $1, "sku" = $2 WHERE "status" IN ($3, $4)',
      values: [2, 'W', 'a', 'b'],
    });
  });

  it('appends RETURNING after the WHERE clause', () => {
    const result = buildUpdateQuery({
      filters: [{ column: 'widget_id', operator: 'eq', value: 1 }],
      returning: ['*'],
      schema: 'inventory',
      table: 'widgets',
      values: { sku: 'W' },
    });

    expect(result.text).toBe(
      'UPDATE "inventory"."widgets" SET "sku" = $1 WHERE "widget_id" = $2 RETURNING *',
    );
  });

  it('refuses to build an unfiltered UPDATE', () => {
    expect(() =>
      buildUpdateQuery({
        filters: [],
        schema: 'inventory',
        table: 'widgets',
        values: { sku: 'W' },
      }),
    ).toThrow();
  });

  it('throws when there are no columns to update', () => {
    expect(() =>
      buildUpdateQuery({
        filters: [{ column: 'widget_id', operator: 'eq', value: 1 }],
        schema: 'inventory',
        table: 'widgets',
        values: {},
      }),
    ).toThrow();
  });

  it('rejects an unsafe SET column key', () => {
    expect(() =>
      buildUpdateQuery({
        filters: [{ column: 'widget_id', operator: 'eq', value: 1 }],
        schema: 'inventory',
        table: 'widgets',
        values: { 'sku; DROP TABLE users': 'W' },
      }),
    ).toThrow();
  });

  it('rejects a SET column not present in an optional allowedColumns list', () => {
    expect(() =>
      buildUpdateQuery({
        allowedColumns: ['sku'],
        filters: [{ column: 'sku', operator: 'eq', value: 'a' }],
        schema: 'inventory',
        table: 'widgets',
        values: { forbidden: 'W' },
      }),
    ).toThrow();
  });
});
