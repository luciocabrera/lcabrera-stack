import { expect, it } from 'vite-plus/test';

import { buildCreateNotesTab } from './buildCreateNotesTab.util';
import { collectOrderFormAccessors } from './collectOrderFormAccessors.util';

it('is the Notes tab without the audit group', () => {
  const tab = buildCreateNotesTab();
  const accessors = collectOrderFormAccessors(tab.fields);

  expect(tab.label).toBe('Notes & Audit');
  expect(accessors).toContain('order_notes');
  expect(accessors).not.toContain('created_at');
  expect(accessors).not.toContain('order_id');
});
