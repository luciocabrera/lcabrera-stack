import { expect, it } from 'vite-plus/test';

import { buildCreatePricingTab } from './buildCreatePricingTab.util';
import { collectOrderFormAccessors } from './collectOrderFormAccessors.util';

it('is the Pricing tab without computed totals', () => {
  const tab = buildCreatePricingTab();
  const accessors = collectOrderFormAccessors(tab.fields);

  expect(tab.label).toBe('Pricing');
  expect(accessors).toContain('discount_percentage');
  expect(accessors).not.toContain('subtotal');
  expect(accessors).not.toContain('total_amount');
});
