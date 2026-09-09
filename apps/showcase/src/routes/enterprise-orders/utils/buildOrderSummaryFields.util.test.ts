import { expect, it } from 'vite-plus/test';

import { buildOrderSummaryFields } from './buildOrderSummaryFields.util';
import { collectOrderFormAccessors } from './collectOrderFormAccessors.util';

it('exposes date, status and priority', () => {
  expect(collectOrderFormAccessors(buildOrderSummaryFields())).toStrictEqual([
    'order_date',
    'order_status',
    'priority',
  ]);
});
