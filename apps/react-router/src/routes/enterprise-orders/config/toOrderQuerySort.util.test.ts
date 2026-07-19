import { expect, it } from 'vitest';

import { toOrderQuerySort } from './toOrderQuerySort.util';

it('maps columnKey/direction and defaults a missing direction to asc', () => {
  expect(
    toOrderQuerySort({
      sorting: [
        { columnKey: 'order_date', direction: 'desc' },
        { columnKey: 'order_id' },
      ],
    }),
  ).toStrictEqual([
    { column: 'order_date', direction: 'desc' },
    { column: 'order_id', direction: 'asc' },
  ]);
});

it('skips the synthetic actions column', () => {
  expect(
    toOrderQuerySort({
      sorting: [
        { columnKey: 'actions', direction: 'asc' },
        { columnKey: 'order_id', direction: 'asc' },
      ],
    }),
  ).toStrictEqual([{ column: 'order_id', direction: 'asc' }]);
});
