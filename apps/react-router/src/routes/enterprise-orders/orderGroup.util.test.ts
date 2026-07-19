import { expect, it } from 'vitest';

import { orderGroup } from './orderGroup.util';
import { orderToggle } from './orderToggle.util';

const cell = orderToggle({ accessor: 'is_gift', label: 'Gift' });

it('builds a plain group', () => {
  expect(orderGroup({ fields: [cell], label: 'Flags' })).toStrictEqual({
    fields: [cell],
    label: 'Flags',
    type: 'group',
  });
});

it('includes the collapsible flags when provided', () => {
  expect(
    orderGroup({
      collapsible: true,
      defaultCollapsed: true,
      fields: [cell],
      label: 'Audit',
    }),
  ).toStrictEqual({
    collapsible: true,
    defaultCollapsed: true,
    fields: [cell],
    label: 'Audit',
    type: 'group',
  });
});

it('keeps an explicit collapsible: false', () => {
  expect(
    orderGroup({ collapsible: false, fields: [cell], label: 'Summary' }),
  ).toStrictEqual({
    collapsible: false,
    fields: [cell],
    label: 'Summary',
    type: 'group',
  });
});
