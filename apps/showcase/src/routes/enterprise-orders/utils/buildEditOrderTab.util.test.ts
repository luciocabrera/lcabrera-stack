import { expect, it } from 'vite-plus/test';

import { buildEditOrderTab } from './buildEditOrderTab.util';
import { collectOrderFormAccessors } from './collectOrderFormAccessors.util';

it('is the Order tab with a disabled order_number', () => {
  const tab = buildEditOrderTab();
  const accessors = collectOrderFormAccessors(tab.fields);

  expect(tab.label).toBe('Order');
  expect(accessors).toContain('order_number');
  expect(accessors).toContain('order_date');
});
