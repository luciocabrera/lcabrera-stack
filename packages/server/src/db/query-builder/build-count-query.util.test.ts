import { describe, expect, it } from 'vite-plus/test';

import { buildCountQuery } from './build-count-query.util.ts';

describe('buildCountQuery', () => {
  it('counts every row with `count(*)` by default', () => {
    const result = buildCountQuery({
      schema: 'reporting',
      table: 'v_order_totals',
    });

    expect(result).toEqual({
      text: 'SELECT count(*) AS count FROM "reporting"."v_order_totals"',
      values: [],
    });
  });

  it('counts the given column when `column` is provided', () => {
    const result = buildCountQuery({
      column: 'order_id',
      schema: 'public',
      table: 'enterprise_orders',
    });

    expect(result).toEqual({
      text: 'SELECT count("order_id") AS count FROM "public"."enterprise_orders"',
      values: [],
    });
  });

  it('applies the same WHERE clause a matching buildSelectQuery call would produce', () => {
    const result = buildCountQuery({
      filters: [{ column: 'order_status', operator: 'eq', value: 'Shipped' }],
      schema: 'reporting',
      table: 'v_order_totals',
    });

    expect(result).toEqual({
      text: 'SELECT count(*) AS count FROM "reporting"."v_order_totals" WHERE "order_status" = $1',
      values: ['Shipped'],
    });
  });

  it('rejects an unsafe table name', () => {
    expect(() =>
      buildCountQuery({
        schema: 'reporting',
        table: 't; DROP TABLE reporting.users',
      }),
    ).toThrow();
  });

  it('rejects an unsafe count column', () => {
    expect(() =>
      buildCountQuery({
        column: 'id); DROP TABLE reporting.users --',
        schema: 'reporting',
        table: 'v_order_totals',
      }),
    ).toThrow();
  });

  it('rejects a count column outside allowedColumns', () => {
    expect(() =>
      buildCountQuery({
        allowedColumns: ['order_status'],
        column: 'password_hash',
        schema: 'reporting',
        table: 'v_order_totals',
      }),
    ).toThrow();
  });
});
