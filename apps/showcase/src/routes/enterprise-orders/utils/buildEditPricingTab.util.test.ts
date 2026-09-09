import { expect, it } from 'vite-plus/test';

import { buildEditPricingTab } from './buildEditPricingTab.util';
import { collectOrderFormAccessors } from './collectOrderFormAccessors.util';

it('is the Pricing tab with computed totals', () => {
  const tab = buildEditPricingTab();
  const accessors = collectOrderFormAccessors(tab.fields);

  expect(tab.label).toBe('Pricing');
  expect(accessors).toContain('discount_percentage');
  expect(accessors).toContain('subtotal');
  expect(accessors).toContain('total_amount');
});
