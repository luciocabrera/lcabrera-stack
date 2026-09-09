import { expect, it } from 'vite-plus/test';

import { buildPaymentTab } from './buildPaymentTab.util';
import { collectOrderFormAccessors } from './collectOrderFormAccessors.util';

it('is the Payment tab with status and method', () => {
  const tab = buildPaymentTab();
  const accessors = collectOrderFormAccessors(tab.fields);

  expect(tab.label).toBe('Payment');
  expect(accessors).toContain('payment_status');
  expect(accessors).toContain('payment_method');
});
