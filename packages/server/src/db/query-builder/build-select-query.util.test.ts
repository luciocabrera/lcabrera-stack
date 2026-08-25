import { describe, expect, it } from 'vite-plus/test';

import { buildSelectQuery } from './build-select-query.util.ts';

describe('buildSelectQuery', () => {
  it('builds a plain select with explicit fields and no filters/sort/pagination', () => {
    const result = buildSelectQuery({
      fields: ['order_id', 'customer_name'],
      schema: 'reporting',
      table: 'v_order_totals',
    });

    expect(result).toEqual({
      text: 'SELECT "order_id", "customer_name" FROM "reporting"."v_order_totals"',
      values: [],
    });
  });

  it('emits SELECT DISTINCT when distinct is set', () => {
    const result = buildSelectQuery({
      distinct: true,
      fields: ['color'],
      schema: 'public',
      table: 'car_sales',
    });

    expect(result).toEqual({
      text: 'SELECT DISTINCT "color" FROM "public"."car_sales"',
      values: [],
    });
  });

  it('composes WHERE, ORDER BY, LIMIT, and OFFSET with correctly incrementing placeholders', () => {
    const result = buildSelectQuery({
      fields: ['order_id', 'total_amount'],
      filters: [{ column: 'order_status', operator: 'eq', value: 'Shipped' }],
      limit: 10,
      offset: 20,
      schema: 'reporting',
      sort: [{ column: 'total_amount', direction: 'desc' }],
      table: 'v_order_totals',
    });

    expect(result).toEqual({
      text:
        'SELECT "order_id", "total_amount" FROM "reporting"."v_order_totals" ' +
        'WHERE "order_status" = $1 ORDER BY "total_amount" DESC LIMIT $2 OFFSET $3',
      values: ['Shipped', 10, 20],
    });
  });

  it('rejects an unsafe schema name', () => {
    expect(() =>
      buildSelectQuery({
        fields: ['a'],
        schema: 'reporting; DROP SCHEMA reporting',
        table: 't',
      }),
    ).toThrow();
  });

  it('rejects an unsafe table name', () => {
    expect(() =>
      buildSelectQuery({
        fields: ['a'],
        schema: 'reporting',
        table: 't; DROP TABLE reporting.users',
      }),
    ).toThrow();
  });

  it('rejects an unsafe field name', () => {
    expect(() =>
      buildSelectQuery({
        fields: ['a; DROP TABLE reporting.users'],
        schema: 'reporting',
        table: 'v_order_totals',
      }),
    ).toThrow();
  });

  it('rejects a field not present in an optional allowedColumns list', () => {
    expect(() =>
      buildSelectQuery({
        allowedColumns: ['order_id'],
        fields: ['password_hash'],
        schema: 'reporting',
        table: 'v_order_totals',
      }),
    ).toThrow();
  });

  it('allows a field that is present in an optional allowedColumns list', () => {
    expect(() =>
      buildSelectQuery({
        allowedColumns: ['order_id'],
        fields: ['order_id'],
        schema: 'reporting',
        table: 'v_order_totals',
      }),
    ).not.toThrow();
  });

  it('seeks past a keyset cursor instead of counting rows, keeping LIMIT last', () => {
    const result = buildSelectQuery({
      cursor: { uniqueColumn: 'order_id', values: ['2026-01-04', 4821] },
      fields: ['order_id', 'order_date'],
      filters: [{ column: 'order_status', operator: 'eq', value: 'Shipped' }],
      limit: 50,
      schema: 'public',
      sort: [
        { column: 'order_date', direction: 'desc' },
        { column: 'order_id', direction: 'asc' },
      ],
      table: 'enterprise_orders',
    });

    expect(result).toEqual({
      text:
        'SELECT "order_id", "order_date" FROM "public"."enterprise_orders" ' +
        'WHERE "order_status" = $1 AND ' +
        '(("order_date" < $2) OR ' +
        '("order_date" IS NOT DISTINCT FROM $2 AND ("order_id" > $3 OR "order_id" IS NULL))) ' +
        'ORDER BY "order_date" DESC, "order_id" ASC LIMIT $4',
      values: ['Shipped', '2026-01-04', 4821, 50],
    });
  });

  it('leaves an offset query byte-identical when no cursor is passed', () => {
    const descriptor = {
      fields: ['order_id'],
      limit: 50,
      offset: 100,
      schema: 'public',
      sort: [{ column: 'order_id', direction: 'asc' }],
      table: 'enterprise_orders',
    } as const;

    expect(buildSelectQuery(descriptor)).toEqual({
      text: 'SELECT "order_id" FROM "public"."enterprise_orders" ORDER BY "order_id" ASC LIMIT $1 OFFSET $2',
      values: [50, 100],
    });
  });

  it('refuses a cursor without a total order to seek along', () => {
    expect(() =>
      buildSelectQuery({
        cursor: { uniqueColumn: 'order_id', values: [4821] },
        fields: ['order_id'],
        schema: 'public',
        table: 'enterprise_orders',
      }),
    ).toThrow(/requires a sort/);
  });
});
