import { describe, expect, it } from 'vite-plus/test';

import { buildKeysetClause } from './build-keyset-clause.util.ts';

const ORDER_DATE_DESC_THEN_ID = [
  { column: 'order_date', direction: 'desc' },
  { column: 'order_id', direction: 'asc' },
] as const;

/**
 * A cursor reaches the builder as JSON off a request, where a NULL column is
 * `null` — parsing it here is how it actually arrives, and keeps the literal
 * out of our own source (`unicorn/no-null`).
 */
const NULL_LEADING_CURSOR = JSON.parse('[null, 4821]') as readonly unknown[];

describe('buildKeysetClause', () => {
  it('emits nothing when there is no cursor', () => {
    expect(
      buildKeysetClause({ sort: ORDER_DATE_DESC_THEN_ID, startParamIndex: 3 }),
    ).toEqual({ nextParamIndex: 3, text: '', values: [] });
  });

  it('emits one OR-branch per sort position, binding each cursor value once', () => {
    expect(
      buildKeysetClause({
        cursor: { uniqueColumn: 'order_id', values: ['2026-01-04', 4821] },
        sort: ORDER_DATE_DESC_THEN_ID,
      }),
    ).toEqual({
      nextParamIndex: 3,
      text:
        '(("order_date" < $1) OR ' +
        '("order_date" IS NOT DISTINCT FROM $1 AND ("order_id" > $2 OR "order_id" IS NULL)))',
      values: ['2026-01-04', 4821],
    });
  });

  it('numbers placeholders from startParamIndex so it can follow a filter clause', () => {
    const result = buildKeysetClause({
      cursor: { uniqueColumn: 'order_id', values: [4821] },
      sort: [{ column: 'order_id', direction: 'asc' }],
      startParamIndex: 4,
    });

    expect(result).toEqual({
      nextParamIndex: 5,
      text: '((("order_id" > $4 OR "order_id" IS NULL)))',
      values: [4821],
    });
  });

  it('drops the unsatisfiable branch of a null value sorted ascending', () => {
    const result = buildKeysetClause({
      cursor: { uniqueColumn: 'order_id', values: NULL_LEADING_CURSOR },
      sort: [
        { column: 'delivery_date', direction: 'asc' },
        { column: 'order_id', direction: 'asc' },
      ],
    });

    expect(result.text).toBe(
      '(("delivery_date" IS NOT DISTINCT FROM $1 AND ("order_id" > $2 OR "order_id" IS NULL)))',
    );
    expect(result.values).toBe(NULL_LEADING_CURSOR);
  });

  it('resumes from a null value sorted descending into every non-null row', () => {
    const result = buildKeysetClause({
      cursor: { uniqueColumn: 'order_id', values: NULL_LEADING_CURSOR },
      sort: [
        { column: 'delivery_date', direction: 'desc' },
        { column: 'order_id', direction: 'asc' },
      ],
    });

    expect(result.text).toBe(
      '(("delivery_date" IS NOT NULL) OR ' +
        '("delivery_date" IS NOT DISTINCT FROM $1 AND ("order_id" > $2 OR "order_id" IS NULL)))',
    );
  });

  it('binds exactly one value per placeholder it emits', () => {
    const result = buildKeysetClause({
      cursor: { uniqueColumn: 'order_id', values: NULL_LEADING_CURSOR },
      sort: [
        { column: 'delivery_date', direction: 'asc' },
        { column: 'order_id', direction: 'asc' },
      ],
    });
    const placeholders = new Set(result.text.match(/\$\d+/g));

    expect(placeholders.size).toBe(result.values.length);
  });

  it('rejects a cursor column outside an optional allowedColumns list', () => {
    expect(() =>
      buildKeysetClause({
        allowedColumns: ['order_id'],
        cursor: { uniqueColumn: 'order_id', values: ['2026-01-04', 4821] },
        sort: ORDER_DATE_DESC_THEN_ID,
      }),
    ).toThrow(/not in the allowed list/);
  });

  it('rejects an unsafe cursor column name', () => {
    expect(() =>
      buildKeysetClause({
        cursor: { uniqueColumn: 'order_id', values: [1, 2] },
        sort: [
          { column: 'order_id; DROP TABLE orders', direction: 'asc' },
          { column: 'order_id', direction: 'asc' },
        ],
      }),
    ).toThrow(/Unsafe identifier/);
  });
});
