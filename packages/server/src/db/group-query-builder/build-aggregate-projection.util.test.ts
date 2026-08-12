import { describe, expect, it } from 'vite-plus/test';

import { buildAggregateProjection } from './build-aggregate-projection.util.ts';

const ALLOWED = ['total_amount', 'priority', 'shipping_country', 'is_gift'];

describe('buildAggregateProjection', () => {
  it('emits count(*) for an aggregate with no column', () => {
    const result = buildAggregateProjection({
      aliased: [{ aggregate: { fn: 'count' }, alias: 'count_rows' }],
      allowedColumns: ALLOWED,
      startParamIndex: 1,
    });

    expect(result).toEqual({
      nextParamIndex: 1,
      text: 'count(*) AS "count_rows"',
      values: [],
    });
  });

  it('emits DISTINCT inside the call for countDistinct', () => {
    const result = buildAggregateProjection({
      aliased: [
        {
          aggregate: { column: 'shipping_country', fn: 'countDistinct' },
          alias: 'count_distinct_shipping_country',
        },
      ],
      allowedColumns: ALLOWED,
      startParamIndex: 1,
    });

    expect(result.text).toBe(
      'count(DISTINCT "shipping_country") AS "count_distinct_shipping_country"',
    );
  });

  it.each([
    { fn: 'avg', sql: 'avg' },
    { fn: 'boolAnd', sql: 'bool_and' },
    { fn: 'boolOr', sql: 'bool_or' },
    { fn: 'max', sql: 'max' },
    { fn: 'min', sql: 'min' },
    { fn: 'sum', sql: 'sum' },
  ] as const)('emits the SQL name for $fn', ({ fn, sql }) => {
    const result = buildAggregateProjection({
      aliased: [{ aggregate: { column: 'total_amount', fn }, alias: 'a' }],
      allowedColumns: ALLOWED,
      startParamIndex: 1,
    });

    expect(result.text).toBe(`${sql}("total_amount") AS "a"`);
  });

  it('joins several aggregates in order', () => {
    const result = buildAggregateProjection({
      aliased: [
        { aggregate: { fn: 'count' }, alias: 'count_rows' },
        {
          aggregate: { column: 'total_amount', fn: 'sum' },
          alias: 'sum_total_amount',
        },
      ],
      allowedColumns: ALLOWED,
      startParamIndex: 1,
    });

    expect(result.text).toBe(
      'count(*) AS "count_rows", sum("total_amount") AS "sum_total_amount"',
    );
  });

  it('parameterizes a FILTER clause and reports where the next parameter goes', () => {
    // The values array is the assertion that matters: matching only the text
    // would pass even if `$1` were bound to the wrong value.
    const result = buildAggregateProjection({
      aliased: [
        {
          aggregate: {
            filters: [{ column: 'priority', operator: 'eq', value: 'Urgent' }],
            fn: 'count',
          },
          alias: 'count_rows_urgent',
        },
      ],
      allowedColumns: ALLOWED,
      startParamIndex: 1,
    });

    expect(result).toEqual({
      nextParamIndex: 2,
      text: 'count(*) FILTER (WHERE "priority" = $1) AS "count_rows_urgent"',
      values: ['Urgent'],
    });
  });

  it('numbers FILTER parameters in one unbroken run across aggregates', () => {
    const result = buildAggregateProjection({
      aliased: [
        {
          aggregate: {
            filters: [{ column: 'priority', operator: 'eq', value: 'Urgent' }],
            fn: 'count',
          },
          alias: 'urgent',
        },
        { aggregate: { column: 'total_amount', fn: 'sum' }, alias: 'total' },
        {
          aggregate: {
            column: 'total_amount',
            filters: [
              { column: 'is_gift', operator: 'eq', value: false },
              {
                column: 'shipping_country',
                operator: 'in',
                value: ['US', 'CA'],
              },
            ],
            fn: 'sum',
          },
          alias: 'gifted',
        },
      ],
      allowedColumns: ALLOWED,
      startParamIndex: 1,
    });

    expect(result).toEqual({
      nextParamIndex: 5,
      text:
        'count(*) FILTER (WHERE "priority" = $1) AS "urgent", ' +
        'sum("total_amount") AS "total", ' +
        'sum("total_amount") FILTER (WHERE "is_gift" = $2 AND "shipping_country" IN ($3, $4)) AS "gifted"',
      values: ['Urgent', false, 'US', 'CA'],
    });
  });

  it('honours a start index other than 1', () => {
    const result = buildAggregateProjection({
      aliased: [
        {
          aggregate: {
            filters: [{ column: 'priority', operator: 'eq', value: 'Low' }],
            fn: 'count',
          },
          alias: 'low',
        },
      ],
      allowedColumns: ALLOWED,
      startParamIndex: 7,
    });

    expect(result.text).toContain('$7');
    expect(result.nextParamIndex).toBe(8);
  });

  it('refuses a FILTER on a column outside the allowlist', () => {
    expect(() =>
      buildAggregateProjection({
        aliased: [
          {
            aggregate: {
              filters: [{ column: 'salary', operator: 'gt', value: 1 }],
              fn: 'count',
            },
            alias: 'rich',
          },
        ],
        allowedColumns: ALLOWED,
        startParamIndex: 1,
      }),
    ).toThrow('not in the allowed list');
  });
});
