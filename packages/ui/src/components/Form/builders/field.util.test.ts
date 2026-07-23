import { describe, expect, it } from 'vite-plus/test';

import { field } from './field.util';

type TestValues = {
  readonly city: string;
  readonly customerName: string;
  readonly orderNumber: string;
  readonly rating: number;
  readonly shippedDate: string;
};

describe('field', () => {
  it('builds a required text field', () => {
    expect(
      field<TestValues, 'text'>({
        accessor: 'city',
        label: 'City',
        required: true,
        type: 'text',
      }),
    ).toStrictEqual({
      accessor: 'city',
      clientValidation: { required: true },
      label: 'City',
      type: 'text',
    });
  });

  it('builds a field with no validation', () => {
    expect(
      field<TestValues, 'date'>({
        accessor: 'shippedDate',
        label: 'Shipped Date',
        type: 'date',
      }),
    ).toStrictEqual({
      accessor: 'shippedDate',
      label: 'Shipped Date',
      type: 'date',
    });
  });

  it('carries the disabled flag', () => {
    expect(
      field<TestValues, 'text'>({
        accessor: 'orderNumber',
        disabled: true,
        label: 'Order Number',
        type: 'text',
      }),
    ).toStrictEqual({
      accessor: 'orderNumber',
      disabled: true,
      label: 'Order Number',
      type: 'text',
    });
  });

  it('carries the description', () => {
    expect(
      field<TestValues, 'number'>({
        accessor: 'rating',
        description: 'Optional, 1–5.',
        label: 'Rating',
        max: 5,
        min: 1,
        type: 'number',
      }),
    ).toStrictEqual({
      accessor: 'rating',
      clientValidation: { max: 5, min: 1 },
      description: 'Optional, 1–5.',
      label: 'Rating',
      type: 'number',
    });
  });

  it('assembles multi-rule validation', () => {
    expect(
      field<TestValues, 'text'>({
        accessor: 'customerName',
        label: 'Customer Name',
        maxLength: 200,
        required: true,
        type: 'text',
      }),
    ).toStrictEqual({
      accessor: 'customerName',
      clientValidation: { maxLength: 200, required: true },
      label: 'Customer Name',
      type: 'text',
    });
  });
});
