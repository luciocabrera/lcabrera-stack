import { expect, it } from 'vite-plus/test';

import { buildCreateOrderTab } from './buildCreateOrderTab.util';
import { collectOrderFormAccessors } from './collectOrderFormAccessors.util';

it('is the Order tab without order_number', () => {
  const tab = buildCreateOrderTab();
  const accessors = collectOrderFormAccessors(tab.fields);

  expect(tab.label).toBe('Order');
  expect(accessors).toContain('order_date');
  expect(accessors).toContain('is_rush_order');
  expect(accessors).not.toContain('order_number');
});
