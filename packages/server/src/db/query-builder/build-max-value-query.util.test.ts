import { describe, expect, it } from 'vite-plus/test';

import { buildMaxValueQuery } from './build-max-value-query.util.ts';

describe('buildMaxValueQuery', () => {
  it('builds a COALESCE(MAX(col), 0) query with no bound params', () => {
    const result = buildMaxValueQuery({
      column: 'order_id',
      schema: 'public',
      table: 'enterprise_orders',
    });

    expect(result).toEqual({
      text: 'SELECT COALESCE(MAX("order_id"), 0) AS max FROM "public"."enterprise_orders"',
      values: [],
    });
  });

  it('is generic across tables/columns', () => {
    const result = buildMaxValueQuery({
      column: 'widget_id',
      schema: 'inventory',
      table: 'widgets',
    });

    expect(result.text).toBe(
      'SELECT COALESCE(MAX("widget_id"), 0) AS max FROM "inventory"."widgets"',
    );
  });

  it('rejects an unsafe column name', () => {
    expect(() =>
      buildMaxValueQuery({
        column: 'id; DROP TABLE users',
        schema: 'public',
        table: 'widgets',
      }),
    ).toThrow();
  });

  it('rejects a column not present in an optional allowedColumns list', () => {
    expect(() =>
      buildMaxValueQuery({
        allowedColumns: ['widget_id'],
        column: 'secret',
        schema: 'inventory',
        table: 'widgets',
      }),
    ).toThrow();
  });
});
