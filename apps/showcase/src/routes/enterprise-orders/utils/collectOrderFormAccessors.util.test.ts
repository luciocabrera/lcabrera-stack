import { expect, it } from 'vite-plus/test';

import { buildFlagsGroup } from './buildFlagsGroup.util';
import { collectOrderFormAccessors } from './collectOrderFormAccessors.util';
import { toOrderFormFields } from './toOrderFormFields.util';

it('collects leaf accessors from groups and rows', () => {
  expect(collectOrderFormAccessors([buildFlagsGroup()])).toStrictEqual([
    'is_rush_order',
    'is_gift',
    'is_fragile',
    'requires_signature',
  ]);
});

it('walks a tab container into each tab', () => {
  const fields = toOrderFormFields([
    { fields: [buildFlagsGroup()], label: 'Flags' },
  ]);

  expect(collectOrderFormAccessors(fields)).toContain('is_rush_order');
});
