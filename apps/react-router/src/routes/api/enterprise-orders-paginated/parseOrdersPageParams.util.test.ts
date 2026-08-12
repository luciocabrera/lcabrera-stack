import { expect, it } from 'vite-plus/test';

import { parseOrdersPageParams } from './parseOrdersPageParams.util';

it('parses limit/skip and translates the filter + sort payloads', () => {
  const params = new URLSearchParams({
    filter: JSON.stringify({
      is_vip_customer: { type: 'boolean', value: true },
    }),
    limit: '25',
    skip: '50',
    sort: JSON.stringify([{ columnKey: 'order_id', direction: 'desc' }]),
  });

  const result = parseOrdersPageParams(params);

  expect(result.limit).toBe(25);
  expect(result.skip).toBe(50);
  expect(result.filters).toStrictEqual([
    { column: 'is_vip_customer', operator: 'eq', value: true },
  ]);
  expect(result.sort).toStrictEqual([
    { column: 'order_id', direction: 'desc' },
  ]);
});

it('falls back for missing/invalid params and malformed JSON', () => {
  const result = parseOrdersPageParams(
    new URLSearchParams({ filter: '{bad', limit: '-1' }),
  );

  expect(result.skip).toBe(0);
  expect(result.filters).toStrictEqual([]);
  expect(result.limit).toBeGreaterThan(0);
});

// A paginated read with no ORDER BY repeats and skips rows as the planner
// changes plans between requests, so every path below must still name a column.
// The Table client always sends a sort; these are the callers that do not.
it.each([
  { label: 'no sort param at all', params: new URLSearchParams() },
  {
    label: 'malformed sort JSON',
    params: new URLSearchParams({ sort: '{bad' }),
  },
  {
    label: 'a sort param that is not an array',
    params: new URLSearchParams({ sort: '"nope"' }),
  },
  { label: 'an empty sort array', params: new URLSearchParams({ sort: '[]' }) },
])('orders by the primary key given $label', ({ params }) => {
  expect(parseOrdersPageParams(params).sort).toStrictEqual([
    { column: 'order_id', direction: 'asc' },
  ]);
});

it('orders by the primary key when every rule sanitizes away', () => {
  const params = new URLSearchParams({
    sort: JSON.stringify([
      // The synthetic UI-only column, which is not a real database column.
      { columnKey: 'actions', direction: 'asc' },
      // A column the user cycled back to unsorted.
      { columnKey: 'order_number' },
    ]),
  });

  expect(parseOrdersPageParams(params).sort).toStrictEqual([
    { column: 'order_id', direction: 'asc' },
  ]);
});

it('leaves a request that did send a sort untouched', () => {
  const params = new URLSearchParams({
    sort: JSON.stringify([
      { columnKey: 'order_date', direction: 'desc' },
      { columnKey: 'order_id', direction: 'asc' },
    ]),
  });

  // No fallback appended, no reordering — the fallback applies only to an
  // empty sort, never as an extra tiebreaker on one the caller supplied.
  expect(parseOrdersPageParams(params).sort).toStrictEqual([
    { column: 'order_date', direction: 'desc' },
    { column: 'order_id', direction: 'asc' },
  ]);
});

it('parses a keyset cursor tuple, and ignores one that is not an array', () => {
  const withCursor = parseOrdersPageParams(
    new URLSearchParams({ cursor: JSON.stringify(['2026-01-04', 4821]) }),
  );

  expect(withCursor.cursor).toStrictEqual(['2026-01-04', 4821]);

  expect(
    parseOrdersPageParams(new URLSearchParams({ cursor: '{bad' })).cursor,
  ).toBeUndefined();
  expect(
    parseOrdersPageParams(new URLSearchParams({ cursor: '"nope"' })).cursor,
  ).toBeUndefined();
  expect(parseOrdersPageParams(new URLSearchParams()).cursor).toBeUndefined();
});
