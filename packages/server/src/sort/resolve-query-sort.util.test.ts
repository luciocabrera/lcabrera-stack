import { expect, it } from 'vite-plus/test';

import { resolveQuerySort } from './resolve-query-sort.util.ts';

it('renames columnKey to column, preserving order and direction', () => {
  expect(
    resolveQuerySort({
      fallback: [{ columnKey: 'id', direction: 'asc' }],
      sorting: [
        { columnKey: 'name', direction: 'desc' },
        { columnKey: 'created_at', direction: 'asc' },
      ],
    }),
  ).toStrictEqual([
    { column: 'name', direction: 'desc' },
    { column: 'created_at', direction: 'asc' },
  ]);
});

it('substitutes the fallback when the request carries no sort', () => {
  expect(
    resolveQuerySort({
      fallback: [{ columnKey: 'car_id', direction: 'asc' }],
      sorting: [],
    }),
  ).toStrictEqual([{ column: 'car_id', direction: 'asc' }]);
});

it('throws when neither the request nor the fallback yields a sort rule', () => {
  expect(() => resolveQuerySort({ fallback: [], sorting: [] })).toThrow(
    /non-empty `fallback` sort is required/,
  );
});

it('leaves both inputs untouched', () => {
  const fallback = [{ columnKey: 'id', direction: 'asc' }] as const;
  const sorting = [{ columnKey: 'name', direction: 'desc' }] as const;

  resolveQuerySort({ fallback, sorting });

  expect(fallback).toStrictEqual([{ columnKey: 'id', direction: 'asc' }]);
  expect(sorting).toStrictEqual([{ columnKey: 'name', direction: 'desc' }]);
});
