import { expect, it } from 'vite-plus/test';

import { toQuerySortRules } from './to-query-sort-rules.util.ts';

it('keeps every rule that names a column and a direction, in order', () => {
  expect(
    toQuerySortRules({
      sorting: [
        { columnKey: 'name', direction: 'desc' },
        { columnKey: 'id', direction: 'asc' },
      ],
    }),
  ).toStrictEqual([
    { columnKey: 'name', direction: 'desc' },
    { columnKey: 'id', direction: 'asc' },
  ]);
});

it('drops a rule with no direction, and one on an ignored column', () => {
  expect(
    toQuerySortRules({
      ignoredColumns: ['menu'],
      sorting: [
        { columnKey: 'menu', direction: 'asc' },
        { columnKey: 'name' },
        { columnKey: 'id', direction: 'asc' },
      ],
    }),
  ).toStrictEqual([{ columnKey: 'id', direction: 'asc' }]);
});

it('drops entries that are not sort rules at all', () => {
  expect(
    toQuerySortRules({
      sorting: [
        JSON.parse('null'),
        'name',
        42,
        { columnKey: 7, direction: 'asc' },
        { columnKey: 'name', direction: 'sideways' },
      ],
    }),
  ).toStrictEqual([]);
});
