import { describe, expect, it } from 'vite-plus/test';

import { buildCountRead } from './build-count-read.util.ts';

describe('buildCountRead', () => {
  it('counts every row with `count(*)` by default', () => {
    const result = buildCountRead({
      schema: 'reporting',
      table: 'v_order_totals',
    });

    expect(result).toEqual({
      text: 'SELECT count(*) AS count FROM "reporting"."v_order_totals"',
      values: [],
    });
  });

  it('counts the given column when `column` is provided', () => {
    const result = buildCountRead({
      column: 'order_id',
      schema: 'public',
      table: 'enterprise_orders',
    });

    expect(result).toEqual({
      text: 'SELECT count("order_id") AS count FROM "public"."enterprise_orders"',
      values: [],
    });
  });

  it('applies the same WHERE clause a matching buildRowsRead call would produce', () => {
    const result = buildCountRead({
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
      buildCountRead({
        schema: 'reporting',
        table: 't; DROP TABLE reporting.users',
      }),
    ).toThrow('Unsafe identifier: "t; DROP TABLE reporting.users"');
  });

  it('rejects an unsafe count column', () => {
    expect(() =>
      buildCountRead({
        column: 'id); DROP TABLE reporting.users --',
        schema: 'reporting',
        table: 'v_order_totals',
      }),
    ).toThrow('Unsafe identifier: "id); DROP TABLE reporting.users --"');
  });

  it('rejects a count column outside allowedColumns', () => {
    expect(() =>
      buildCountRead({
        allowedColumns: ['order_status'],
        column: 'password_hash',
        schema: 'reporting',
        table: 'v_order_totals',
      }),
    ).toThrow(
      'Column "password_hash" is not in the allowed list for this query.',
    );
  });

  it('ignores a row or grouping field the descriptor also carries', () => {
    const descriptor = {
      column: 'id',
      grouping: 'rollup',
      limit: 5,
      schema: 'catalog',
      sort: [{ column: 'id', direction: 'asc' }],
      table: 'items',
    } as const;

    expect(buildCountRead(descriptor)).toEqual({
      text: 'SELECT count("id") AS count FROM "catalog"."items"',
      values: [],
    });
  });
});
