import { describe, expect, it } from 'vite-plus/test';

import { toKeysetCursor } from './to-keyset-cursor.util.ts';

const NULL_UNIQUE_CURSOR = JSON.parse(
  '["2026-01-04", null]',
) as readonly unknown[];

const SORT = [
  { column: 'created_on', direction: 'desc' },
  { column: 'id', direction: 'asc' },
] as const;

describe('toKeysetCursor', () => {
  it('builds a cursor anchored on the unique column', () => {
    expect(
      toKeysetCursor({
        cursor: ['2026-01-04', 4821],
        sort: SORT,
        uniqueColumn: 'id',
      }),
    ).toStrictEqual({ uniqueColumn: 'id', values: ['2026-01-04', 4821] });
  });

  it('falls back to offset when there is no cursor', () => {
    expect(toKeysetCursor({ sort: SORT, uniqueColumn: 'id' })).toBeUndefined();
  });

  it('falls back to offset when the tuple does not match the sort', () => {
    expect(
      toKeysetCursor({ cursor: [4821], sort: SORT, uniqueColumn: 'id' }),
    ).toBeUndefined();
  });

  it('falls back to offset when the unique column is not the last sort column', () => {
    expect(
      toKeysetCursor({
        cursor: [4821, 'Acme'],
        sort: [
          { column: 'id', direction: 'asc' },
          { column: 'name', direction: 'asc' },
        ],
        uniqueColumn: 'id',
      }),
    ).toBeUndefined();
  });

  it('falls back to offset when the unique value is missing', () => {
    expect(
      toKeysetCursor({
        cursor: NULL_UNIQUE_CURSOR,
        sort: SORT,
        uniqueColumn: 'id',
      }),
    ).toBeUndefined();
    expect(
      toKeysetCursor({
        cursor: ['2026-01-04', undefined],
        sort: SORT,
        uniqueColumn: 'id',
      }),
    ).toBeUndefined();
  });
});
