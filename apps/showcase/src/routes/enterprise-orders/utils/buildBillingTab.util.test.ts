import { expect, it } from 'vite-plus/test';

import { buildBillingTab } from './buildBillingTab.util';
import { collectOrderFormAccessors } from './collectOrderFormAccessors.util';

it('is the Billing tab with the billing address', () => {
  const tab = buildBillingTab();
  const accessors = collectOrderFormAccessors(tab.fields);

  expect(tab.label).toBe('Billing');
  expect(accessors).toContain('billing_address_line1');
  expect(accessors).toContain('billing_city');
});
