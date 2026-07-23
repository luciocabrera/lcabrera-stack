import type { LeafFieldDef } from '@lcabrera/ui/components/Form/Form.types';

import { describe, expect, it } from 'vite-plus/test';

import { validateField } from './validateField.util';

type Values = { readonly age: number; readonly name: string };

describe('validateField', () => {
  it('returns undefined when the field has no client validation', () => {
    const field: LeafFieldDef<Values> = {
      accessor: 'name',
      label: 'Name',
      type: 'text',
    };

    expect(validateField({ field, value: '' })).toBeUndefined();
  });

  it('returns the required message when a required field is empty', () => {
    const field: LeafFieldDef<Values> = {
      accessor: 'name',
      clientValidation: { required: true },
      label: 'Name',
      type: 'text',
    };

    expect(validateField({ field, value: '' })).toBe('Name is required.');
  });

  it('treats an empty array as empty for required validation', () => {
    const field: LeafFieldDef<Values> = {
      accessor: 'name',
      clientValidation: { required: true },
      label: 'Name',
      type: 'text',
    };

    expect(validateField({ field, value: [] })).toBe('Name is required.');
  });

  it('returns undefined when a non-required field is empty', () => {
    const field: LeafFieldDef<Values> = {
      accessor: 'name',
      clientValidation: { minLength: 3 },
      label: 'Name',
      type: 'text',
    };

    expect(validateField({ field, value: '' })).toBeUndefined();
  });

  it('delegates to string validation for string values', () => {
    const field: LeafFieldDef<Values> = {
      accessor: 'name',
      clientValidation: { minLength: 3 },
      label: 'Name',
      type: 'text',
    };

    expect(validateField({ field, value: 'ab' })).toBe('Name is invalid.');
  });

  it('delegates to number validation for number values', () => {
    const field: LeafFieldDef<Values> = {
      accessor: 'age',
      clientValidation: { min: 18 },
      label: 'Age',
      type: 'number',
    };

    expect(validateField({ field, value: 5 })).toBe('Age is invalid.');
  });

  it('uses the custom validation message when provided', () => {
    const field: LeafFieldDef<Values> = {
      accessor: 'name',
      clientValidation: {
        message: 'Name must be at least 3 chars',
        minLength: 3,
      },
      label: 'Name',
      type: 'text',
    };

    expect(validateField({ field, value: 'ab' })).toBe(
      'Name must be at least 3 chars',
    );
  });
});
