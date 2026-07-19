import { expect, it } from 'vitest';

import { orderField } from './orderField.util';

it('builds a required text field', () => {
  expect(
    orderField({
      accessor: 'shipping_city',
      label: 'City',
      required: true,
      type: 'text',
    }),
  ).toStrictEqual({
    accessor: 'shipping_city',
    clientValidation: { required: true },
    label: 'City',
    type: 'text',
  });
});

it('builds a field with no validation', () => {
  expect(
    orderField({
      accessor: 'shipped_date',
      label: 'Shipped Date',
      type: 'date',
    }),
  ).toStrictEqual({
    accessor: 'shipped_date',
    label: 'Shipped Date',
    type: 'date',
  });
});

it('carries disabled and description flags', () => {
  expect(
    orderField({
      accessor: 'order_number',
      disabled: true,
      label: 'Order Number',
      type: 'text',
    }),
  ).toStrictEqual({
    accessor: 'order_number',
    disabled: true,
    label: 'Order Number',
    type: 'text',
  });
});

it('assembles multi-rule validation', () => {
  expect(
    orderField({
      accessor: 'customer_name',
      label: 'Customer Name',
      maxLength: 200,
      required: true,
      type: 'text',
    }),
  ).toStrictEqual({
    accessor: 'customer_name',
    clientValidation: { maxLength: 200, required: true },
    label: 'Customer Name',
    type: 'text',
  });
});
