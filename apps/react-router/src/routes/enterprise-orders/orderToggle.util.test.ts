import { expect, it } from 'vitest';

import { orderToggle } from './orderToggle.util';

it('builds a boolean toggle field', () => {
  expect(
    orderToggle({ accessor: 'is_rush_order', label: 'Rush order' }),
  ).toStrictEqual({
    accessor: 'is_rush_order',
    label: 'Rush order',
    type: 'boolean',
    variant: 'toggle',
  });
});
