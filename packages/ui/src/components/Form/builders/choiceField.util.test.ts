import { describe, expect, it } from 'vite-plus/test';

import { choiceField } from './choiceField.util';

type TestValues = {
  readonly category: string;
  readonly priority: string;
  readonly status: string;
};

const options = [{ label: 'High', value: 'High' }];

describe('choiceField', () => {
  it('builds a required radio field with options', () => {
    expect(
      choiceField<TestValues, 'radio'>({
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

  it('builds a select field with a description', () => {
    expect(
      choiceField<TestValues, 'select'>({
        accessor: 'category',
        description: 'Pick one.',
        label: 'Category',
        options,
        type: 'select',
      }),
    ).toStrictEqual({
      accessor: 'category',
      description: 'Pick one.',
      label: 'Category',
      options,
      type: 'select',
    });
  });

  it('builds a select field without validation or description', () => {
    expect(
      choiceField<TestValues, 'select'>({
        accessor: 'status',
        label: 'Status',
        options,
        type: 'select',
      }),
    ).toStrictEqual({
      accessor: 'status',
      label: 'Status',
      options,
      type: 'select',
    });
  });
});
