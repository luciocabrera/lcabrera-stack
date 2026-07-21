import { describe, expect, it } from 'vitest';

import { buildDistinctQuery } from './build-distinct-query.util.ts';

describe('buildDistinctQuery', () => {
  it('builds a paginated distinct query with NULL/empty exclusion and stable ordering', () => {
    const result = buildDistinctQuery({
      column: 'customer_email',
      limit: 50,
      offset: 100,
      schema: 'public',
      table: 'enterprise_orders',
    });

    expect(result).toEqual({
      text: 'SELECT DISTINCT "customer_email" AS value FROM "public"."enterprise_orders" WHERE "customer_email" IS NOT NULL AND "customer_email"::text != \'\' ORDER BY "customer_email" LIMIT $1 OFFSET $2',
      values: [50, 100],
    });
  });

  it('omits pagination clauses when limit/offset are undefined', () => {
    const result = buildDistinctQuery({
      column: 'color',
      schema: 'public',
      table: 'car_sales',
    });

    expect(result).toEqual({
      text: 'SELECT DISTINCT "color" AS value FROM "public"."car_sales" WHERE "color" IS NOT NULL AND "color"::text != \'\' ORDER BY "color"',
      values: [],
    });
  });

  it('enforces the allowedColumns authorization check', () => {
    expect(() =>
      buildDistinctQuery({
        allowedColumns: ['color', 'model'],
        column: 'vin',
        schema: 'public',
        table: 'car_sales',
      }),
    ).toThrow('Column "vin" is not in the allowed list for this query.');
  });

  it('rejects unsafe identifiers', () => {
    expect(() =>
      buildDistinctQuery({
        column: 'value; DROP TABLE users',
        schema: 'public',
        table: 'car_sales',
      }),
    ).toThrow('Unsafe identifier');

    expect(() =>
      buildDistinctQuery({
        column: 'color',
        schema: 'public',
        table: 'car_sales; --',
      }),
    ).toThrow('Unsafe identifier');
  });
});
