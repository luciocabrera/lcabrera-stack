import { expect, it } from 'vitest';

import { orderChoiceField } from './orderChoiceField.util';

const options = [{ label: 'High', value: 'High' }];

it('builds a required radio field with options', () => {
  expect(
    orderChoiceField({
      accessor: 'priority',
      label: 'Priority',
      options,
      required: true,
      type: 'radio',
    }),
  ).toStrictEqual({
    accessor: 'priority',
    clientValidation: { required: true },
    label: 'Priority',
    options,
    type: 'radio',
  });
});

it('builds a select field', () => {
  expect(
    orderChoiceField({
      accessor: 'order_status',
      label: 'Status',
      options,
      required: true,
      type: 'select',
    }),
  ).toStrictEqual({
    accessor: 'order_status',
    clientValidation: { required: true },
    label: 'Status',
    options,
    type: 'select',
  });
});
