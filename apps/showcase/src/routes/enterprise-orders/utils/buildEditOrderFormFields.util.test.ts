import { expect, it } from 'vite-plus/test';

import { buildEditOrderFormFields } from './buildEditOrderFormFields.util';
import { collectOrderFormAccessors } from './collectOrderFormAccessors.util';
import { ORDER_FORM_TAB_LABELS } from './orderFormTabLabels.constants';
import { readOrderFormTabLabels } from './readOrderFormTabLabels.util';

it('includes order_number and the audit group', () => {
  const accessors = collectOrderFormAccessors(buildEditOrderFormFields());

  expect(accessors).toContain('order_number');
  expect(accessors).toContain('created_at');
  expect(accessors).toContain('updated_at');
  expect(accessors).toContain('order_id');
  expect(accessors).toContain('last_modified_by');
});

it('includes computed totals', () => {
  const accessors = collectOrderFormAccessors(buildEditOrderFormFields());

  expect(accessors).toContain('subtotal');
  expect(accessors).toContain('total_amount');
});

it('keeps the eight tabs in roster order', () => {
  expect(readOrderFormTabLabels(buildEditOrderFormFields())).toStrictEqual([
    ...ORDER_FORM_TAB_LABELS,
  ]);
});
