import { expect, it } from 'vite-plus/test';

import { buildEditNotesTab } from './buildEditNotesTab.util';
import { collectOrderFormAccessors } from './collectOrderFormAccessors.util';

it('is the Notes tab with the audit group', () => {
  const tab = buildEditNotesTab();
  const accessors = collectOrderFormAccessors(tab.fields);

  expect(tab.label).toBe('Notes & Audit');
  expect(accessors).toContain('order_notes');
  expect(accessors).toContain('created_at');
  expect(accessors).toContain('order_id');
});
