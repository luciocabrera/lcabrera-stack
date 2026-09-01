import { describe, expect, it } from 'vite-plus/test';

import { toOrderKeysetCursor } from './toOrderKeysetCursor.util';

const NULL_ORDER_ID_CURSOR = JSON.parse(
  '["2026-01-04", null]',
) as readonly unknown[];

const SORT = [
  { column: 'order_date', direction: 'desc' },
  { column: 'order_id', direction: 'asc' },
] as const;

describe('toOrderKeysetCursor', () => {
  it('builds a cursor anchored on the primary key', () => {
    expect(
      toOrderKeysetCursor({ cursor: ['2026-01-04', 4821], sort: SORT }),
    ).toStrictEqual({
      uniqueColumn: 'order_id',
      values: ['2026-01-04', 4821],
    });
  });

  it('falls back to offset when there is no cursor', () => {
    expect(toOrderKeysetCursor({ sort: SORT })).toBeUndefined();
  });

  it('falls back to offset when the tuple does not match the sort', () => {
    expect(toOrderKeysetCursor({ cursor: [4821], sort: SORT })).toBeUndefined();
  });

  it('falls back to offset when the primary key is not the last sort column', () => {
    expect(
      toOrderKeysetCursor({
        cursor: [4821, 'Acme'],
        sort: [
          { column: 'order_id', direction: 'asc' },
          { column: 'customer_name', direction: 'asc' },
        ],
      }),
    ).toBeUndefined();
  });

  it('falls back to offset when the primary key value is missing', () => {
    expect(
      toOrderKeysetCursor({ cursor: NULL_ORDER_ID_CURSOR, sort: SORT }),
    ).toBeUndefined();
  });
});
