import { describe, expect, it } from 'vite-plus/test';

import { buildDistinctQuery } from './build-distinct-query.util.ts';

describe('buildDistinctQuery', () => {
  it('is buildSelectQuery + DISTINCT: multi-column projection, filters, sort, pagination', () => {
    const result = buildDistinctQuery({
      fields: ['shipping_country', 'shipping_state'],
      filters: [{ column: 'shipping_country', operator: 'isNotNull' }],
      limit: 50,
      offset: 100,
      schema: 'public',
      sort: [{ column: 'shipping_country', direction: 'asc' }],
      table: 'enterprise_orders',
    });

    expect(result).toEqual({
      text:
        'SELECT DISTINCT "shipping_country", "shipping_state" FROM "public"."enterprise_orders" ' +
        'WHERE "shipping_country" IS NOT NULL ORDER BY "shipping_country" ASC LIMIT $1 OFFSET $2',
      values: [50, 100],
    });
  });

  it('carries the allowedColumns authorization check through to buildSelectQuery', () => {
    expect(() =>
      buildDistinctQuery({
        allowedColumns: ['color', 'model'],
        fields: ['vin'],
        schema: 'public',
        table: 'car_sales',
      }),
    ).toThrow('Column "vin" is not in the allowed list for this query.');
  });

  it('rejects unsafe identifiers', () => {
    expect(() =>
      buildDistinctQuery({
        fields: ['color'],
        schema: 'public',
        table: 'car_sales; --',
      }),
    ).toThrow('Unsafe identifier');
  });
});
