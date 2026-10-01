import { expect, it } from 'vite-plus/test';

import { parseTablePageParams } from './parse-table-page-params.util.ts';

const FALLBACK_SORT = [{ columnKey: 'id', direction: 'asc' }] as const;

const parse = (params: URLSearchParams) =>
  parseTablePageParams({
    defaultLimit: 50,
    fallbackSort: FALLBACK_SORT,
    ignoredSortColumns: ['menu'],
    params,
  });

it('parses limit/skip and translates the filter + sort payloads', () => {
  const result = parse(
    new URLSearchParams({
      filter: JSON.stringify({ is_active: { type: 'boolean', value: true } }),
      limit: '25',
      skip: '50',
      sort: JSON.stringify([{ columnKey: 'id', direction: 'desc' }]),
    }),
  );

  expect(result.limit).toBe(25);
  expect(result.skip).toBe(50);
  expect(result.filters).toStrictEqual([
    { column: 'is_active', operator: 'eq', value: true },
  ]);
  expect(result.sort).toStrictEqual([{ column: 'id', direction: 'desc' }]);
});

it('falls back for missing/invalid params and malformed JSON', () => {
  const result = parse(new URLSearchParams({ filter: '{bad', limit: '-1' }));

  expect(result.skip).toBe(0);
  expect(result.filters).toStrictEqual([]);
  expect(result.limit).toBe(50);
});

it('ignores a filter payload that is not an object', () => {
  expect(
    parse(new URLSearchParams({ filter: '"nope"' })).filters,
  ).toStrictEqual([]);
});

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
])('orders by the fallback sort given $label', ({ params }) => {
  expect(parse(params).sort).toStrictEqual([
    { column: 'id', direction: 'asc' },
  ]);
});

it('orders by the fallback sort when every rule is dropped', () => {
  const params = new URLSearchParams({
    sort: JSON.stringify([
      { columnKey: 'menu', direction: 'asc' },
      { columnKey: 'name' },
    ]),
  });

  expect(parse(params).sort).toStrictEqual([
    { column: 'id', direction: 'asc' },
  ]);
});

it('leaves a request that did send a sort untouched', () => {
  const params = new URLSearchParams({
    sort: JSON.stringify([
      { columnKey: 'created_on', direction: 'desc' },
      { columnKey: 'id', direction: 'asc' },
    ]),
  });

  expect(parse(params).sort).toStrictEqual([
    { column: 'created_on', direction: 'desc' },
    { column: 'id', direction: 'asc' },
  ]);
});

it('keeps every sort rule when no column is ignored', () => {
  const result = parseTablePageParams({
    defaultLimit: 50,
    fallbackSort: FALLBACK_SORT,
    params: new URLSearchParams({
      sort: JSON.stringify([{ columnKey: 'menu', direction: 'asc' }]),
    }),
  });

  expect(result.sort).toStrictEqual([{ column: 'menu', direction: 'asc' }]);
});

it('parses a keyset cursor tuple, and ignores one that is not an array', () => {
  const tuple = JSON.stringify(['2026-01-04', 4821]);

  expect(parse(new URLSearchParams({ cursor: tuple })).cursor).toStrictEqual([
    '2026-01-04',
    4821,
  ]);
  expect(parse(new URLSearchParams({ cursor: '{bad' })).cursor).toBeUndefined();
  expect(
    parse(new URLSearchParams({ cursor: '"nope"' })).cursor,
  ).toBeUndefined();
  expect(parse(new URLSearchParams()).cursor).toBeUndefined();
});
