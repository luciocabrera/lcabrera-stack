import { expect, it } from 'vite-plus/test';

import { buildNotesGroup } from './buildNotesGroup.util';
import { collectOrderFormAccessors } from './collectOrderFormAccessors.util';

it('exposes order and internal notes', () => {
  const group = buildNotesGroup();

  expect(group.label).toBe('Notes');
  expect(collectOrderFormAccessors([group])).toStrictEqual([
    'order_notes',
    'internal_notes',
  ]);
});
