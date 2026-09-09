import { expect, it } from 'vite-plus/test';

import { buildPricingInputsGroup } from './buildPricingInputsGroup.util';
import { collectOrderFormAccessors } from './collectOrderFormAccessors.util';

it('exposes discount, shipping cost and paid amount', () => {
  const group = buildPricingInputsGroup();

  expect(group.label).toBe('Pricing Inputs');
  expect(collectOrderFormAccessors([group])).toStrictEqual([
    'discount_percentage',
    'shipping_cost',
    'paid_amount',
  ]);
});
