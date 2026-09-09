import { expect, it } from 'vite-plus/test';

import { buildFlagsGroup } from './buildFlagsGroup.util';
import { collectOrderFormAccessors } from './collectOrderFormAccessors.util';

it('exposes the four order-flag toggles', () => {
  const group = buildFlagsGroup();

  expect(group.label).toBe('Flags');
  expect(collectOrderFormAccessors([group])).toStrictEqual([
    'is_rush_order',
    'is_gift',
    'is_fragile',
    'requires_signature',
  ]);
});
