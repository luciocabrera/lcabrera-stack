import { describe, expect, it } from 'vite-plus/test';

import { assertKeysetCursor } from './assert-keyset-cursor.util.ts';

/**
 * A cursor reaches the builder as JSON off a request, where a NULL column is
 * `null` — parsing it here is how it actually arrives, and keeps the literal
 * out of our own source (`unicorn/no-null`).
 */
const NULL_ORDER_ID_CURSOR = JSON.parse(
  '["2026-01-04", null]',
) as readonly unknown[];

describe('assertKeysetCursor', () => {
  it('accepts a cursor whose tuple matches a sort ending on the unique column', () => {
    expect(() =>
      assertKeysetCursor({
        cursor: { uniqueColumn: 'order_id', values: ['2026-01-04', 4821] },
        sort: [
          { column: 'order_date', direction: 'desc' },
          { column: 'order_id', direction: 'asc' },
        ],
      }),
    ).not.toThrow();
  });

  it('rejects a cursor with no sort to describe it', () => {
    expect(() =>
      assertKeysetCursor({
        cursor: { uniqueColumn: 'order_id', values: [1] },
      }),
    ).toThrow(/requires a sort/);
  });

  it('rejects a cursor with fewer values than the sort has columns', () => {
    expect(() =>
      assertKeysetCursor({
        cursor: { uniqueColumn: 'order_id', values: [4821] },
        sort: [
          { column: 'order_date', direction: 'desc' },
          { column: 'order_id', direction: 'asc' },
        ],
      }),
    ).toThrow(/one to one/);
  });

  it('rejects a sort that does not end on the unique column', () => {
    expect(() =>
      assertKeysetCursor({
        cursor: { uniqueColumn: 'order_id', values: [4821, '2026-01-04'] },
        sort: [
          { column: 'order_id', direction: 'asc' },
          { column: 'order_date', direction: 'desc' },
        ],
      }),
    ).toThrow(/end on the unique column "order_id"/);
  });

  it('rejects a null value for the unique column — a nullable column is no total order', () => {
    expect(() =>
      assertKeysetCursor({
        cursor: { uniqueColumn: 'order_id', values: NULL_ORDER_ID_CURSOR },
        sort: [
          { column: 'order_date', direction: 'desc' },
          { column: 'order_id', direction: 'asc' },
        ],
      }),
    ).toThrow(/no value for its unique column/);
  });
});
