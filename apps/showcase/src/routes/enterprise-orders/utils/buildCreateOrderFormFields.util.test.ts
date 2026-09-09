import { expect, it } from 'vite-plus/test';

import { buildCreateOrderFormFields } from './buildCreateOrderFormFields.util';
import { collectOrderFormAccessors } from './collectOrderFormAccessors.util';

it('omits order_number and the audit group', () => {
  const accessors = collectOrderFormAccessors(buildCreateOrderFormFields());

  expect(accessors).not.toContain('order_number');
  expect(accessors).not.toContain('created_at');
  expect(accessors).not.toContain('updated_at');
  expect(accessors).not.toContain('order_id');
  expect(accessors).not.toContain('last_modified_by');
});

it('omits computed totals', () => {
  const accessors = collectOrderFormAccessors(buildCreateOrderFormFields());

  expect(accessors).not.toContain('subtotal');
  expect(accessors).not.toContain('total_amount');
});

it('still exposes the required input fields', () => {
  const accessors = collectOrderFormAccessors(buildCreateOrderFormFields());

  expect(accessors).toContain('customer_name');
  expect(accessors).toContain('quantity');
  expect(accessors).toContain('priority');
});

it('keeps the eight tabs in roster order', () => {
  const [root, ...rest] = buildCreateOrderFormFields();

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
