import { expect, it } from 'vite-plus/test';

import { buildCustomerTab } from './buildCustomerTab.util';
import { collectOrderFormAccessors } from './collectOrderFormAccessors.util';

it('is the Customer tab with identity accessors', () => {
  const tab = buildCustomerTab();
  const accessors = collectOrderFormAccessors(tab.fields);

  expect(tab.label).toBe('Customer');
  expect(accessors).toContain('customer_name');
  expect(accessors).toContain('customer_email');
  expect(accessors).toContain('loyalty_points');
});
