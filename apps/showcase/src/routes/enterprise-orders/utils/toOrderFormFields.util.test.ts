import { expect, it } from 'vite-plus/test';

import { ORDER_FORM_TAB_LABELS } from './orderFormTabLabels.constants';
import { readOrderFormTabLabels } from './readOrderFormTabLabels.util';
import { toOrderFormFields } from './toOrderFormFields.util';

it('places shared tabs between the three variant tabs', () => {
  const fields = toOrderFormFields({
    notesTab: { fields: [], label: 'Notes & Audit' },
    orderTab: { fields: [], label: 'Order' },
    pricingTab: { fields: [], label: 'Pricing' },
  });
  const [, ...rest] = fields;

  expect(rest).toHaveLength(0);
  expect(readOrderFormTabLabels(fields)).toStrictEqual([
    ...ORDER_FORM_TAB_LABELS,
  ]);
});
