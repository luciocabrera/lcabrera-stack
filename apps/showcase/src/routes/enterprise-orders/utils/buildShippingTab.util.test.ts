import { expect, it } from 'vite-plus/test';

import { buildShippingTab } from './buildShippingTab.util';
import { collectOrderFormAccessors } from './collectOrderFormAccessors.util';

it('is the Shipping tab with address and carrier', () => {
  const tab = buildShippingTab();
  const accessors = collectOrderFormAccessors(tab.fields);

  expect(tab.label).toBe('Shipping');
  expect(accessors).toContain('shipping_address_line1');
  expect(accessors).toContain('carrier');
});
