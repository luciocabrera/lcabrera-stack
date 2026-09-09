import { expect, it } from 'vite-plus/test';

import { buildCreateOrderFormFields } from './buildCreateOrderFormFields.util';
import { buildFlagsGroup } from './buildFlagsGroup.util';
import { collectOrderFormAccessors } from './collectOrderFormAccessors.util';

it('collects leaf accessors from groups and rows', () => {
  expect(collectOrderFormAccessors([buildFlagsGroup()])).toStrictEqual([
    'is_rush_order',
    'is_gift',
    'is_fragile',
    'requires_signature',
  ]);
});

it('walks a tab container into each tab', () => {
  expect(collectOrderFormAccessors(buildCreateOrderFormFields())).toContain(
    'is_rush_order',
  );
});
