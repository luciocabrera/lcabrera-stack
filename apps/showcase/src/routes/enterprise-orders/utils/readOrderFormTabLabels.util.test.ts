import { expect, it } from 'vite-plus/test';

import { ORDER_FORM_TAB_LABELS } from './orderFormTabLabels.constants';
import { readOrderFormTabLabels } from './readOrderFormTabLabels.util';
import { toOrderFormFields } from './toOrderFormFields.util';

it('reads tab labels from a tab container', () => {
  expect(
    readOrderFormTabLabels(
      toOrderFormFields({
        notesTab: { fields: [], label: 'Notes & Audit' },
        orderTab: { fields: [], label: 'Order' },
        pricingTab: { fields: [], label: 'Pricing' },
      }),
    ),
  ).toStrictEqual([...ORDER_FORM_TAB_LABELS]);
});

it('returns undefined when the root is not a tab container', () => {
  expect(readOrderFormTabLabels([])).toBeUndefined();
});
