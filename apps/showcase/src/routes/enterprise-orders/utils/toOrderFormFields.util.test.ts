import { expect, it } from 'vite-plus/test';

import { toOrderFormFields } from './toOrderFormFields.util';

const emptyTab = (label: string) => ({ fields: [], label });

it('places shared tabs between the three variant tabs', () => {
  const [root, ...rest] = toOrderFormFields({
    notesTab: emptyTab('Notes & Audit'),
    orderTab: emptyTab('Order'),
    pricingTab: emptyTab('Pricing'),
  });

  expect(rest).toHaveLength(0);
  expect(
    root?.type === 'tab' ? root.tabs.map((tab) => tab.label) : undefined,
  ).toStrictEqual([
    'Order',
    'Customer',
    'Product',
    'Pricing',
    'Shipping',
    'Billing',
    'Payment',
    'Notes & Audit',
  ]);
});
