import { expect, it } from 'vitest';

import { orderRow } from './orderRow.util';
import { orderToggle } from './orderToggle.util';

const cell = orderToggle({ accessor: 'is_gift', label: 'Gift' });

it('builds a row without spans', () => {
  expect(orderRow({ fields: [cell] })).toStrictEqual({
    fields: [cell],
    type: 'row',
  });
});

it('includes spans when provided', () => {
  expect(orderRow({ fields: [cell], spans: [2, 1] })).toStrictEqual({
    fields: [cell],
    spans: [2, 1],
    type: 'row',
  });
});
