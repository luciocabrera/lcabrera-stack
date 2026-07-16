import type { LeafFieldDef } from '@repo/ui/components/Form/Form.types';

import { describe, expect, it } from 'vitest';

import { validateFields } from './validateFields.util';

type Values = { readonly age: number; readonly name: string };

describe('validateFields', () => {
  it('reports a required error for an empty required field', () => {
    const leafFields: readonly LeafFieldDef<Values>[] = [
      {
        accessor: 'name',
        clientValidation: { required: true },
        label: 'Name',
        type: 'text',
      },
    ];

    const errors = validateFields<Values>({
      leafFields,
      values: { age: 0, name: '' },
    });

    expect(errors.name).toBe('Name is required.');
  });

  it('reports no error when a required field is filled', () => {
    const leafFields: readonly LeafFieldDef<Values>[] = [
      {
        accessor: 'name',
        clientValidation: { required: true },
        label: 'Name',
        type: 'text',
      },
    ];

    const errors = validateFields<Values>({
      leafFields,
      values: { age: 0, name: 'Ada' },
    });

    expect(errors.name).toBeUndefined();
  });

  it('reports a range error for a number outside min/max', () => {
    const leafFields: readonly LeafFieldDef<Values>[] = [
      {
        accessor: 'age',
        clientValidation: { max: 100, min: 18 },
        label: 'Age',
        type: 'number',
      },
    ];

    const errors = validateFields<Values>({
      leafFields,
      values: { age: 5, name: '' },
    });

    expect(errors.age).toBe('Age is invalid.');
  });

  it('skips non-required fields with no value', () => {
    const leafFields: readonly LeafFieldDef<Values>[] = [
      { accessor: 'name', label: 'Name', type: 'text' },
    ];

    const errors = validateFields<Values>({
      leafFields,
      values: { age: 0, name: '' },
    });

    expect(errors.name).toBeUndefined();
  });
});
