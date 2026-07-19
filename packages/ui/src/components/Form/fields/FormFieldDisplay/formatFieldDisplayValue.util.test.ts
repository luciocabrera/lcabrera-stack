import type { LeafFieldDef } from '@repo/ui/components/Form/Form.types';

import { describe, expect, it } from 'vitest';

import { formatFieldDisplayValue } from './formatFieldDisplayValue.util';

type Values = Record<string, unknown>;

describe('formatFieldDisplayValue', () => {
  it('renders booleans as Yes/No', () => {
    const field: LeafFieldDef<Values> = {
      accessor: 'flag',
      label: 'Flag',
      type: 'boolean',
    };

    expect(formatFieldDisplayValue({ field, value: true })).toBe('Yes');
    expect(formatFieldDisplayValue({ field, value: false })).toBe('No');
    expect(formatFieldDisplayValue({ field, value: undefined })).toBe('No');
  });

  it('formats numbers with the default locale', () => {
    const field: LeafFieldDef<Values> = {
      accessor: 'qty',
      label: 'Quantity',
      type: 'number',
    };

    expect(formatFieldDisplayValue({ field, value: 1234.5 })).toBe('1,234.5');
    expect(formatFieldDisplayValue({ field, value: '42' })).toBe('42');
  });

  it('formats dates via the shared date formatter', () => {
    const field: LeafFieldDef<Values> = {
      accessor: 'when',
      label: 'When',
      type: 'date',
    };

    expect(formatFieldDisplayValue({ field, value: '2026-07-19' })).toContain(
      '2026',
    );
  });

  it('resolves select/radio values to their option labels', () => {
    const selectField: LeafFieldDef<Values> = {
      accessor: 'carrier',
      label: 'Carrier',
      options: [
        { label: 'FedEx', value: 'fedex' },
        { label: 'UPS', value: 'ups' },
      ],
      type: 'select',
    };

    expect(formatFieldDisplayValue({ field: selectField, value: 'ups' })).toBe(
      'UPS',
    );
  });

  it('returns the raw string for text fields and empty for missing values', () => {
    const field: LeafFieldDef<Values> = {
      accessor: 'name',
      label: 'Name',
      type: 'text',
    };

    expect(formatFieldDisplayValue({ field, value: 'Ada' })).toBe('Ada');
    expect(formatFieldDisplayValue({ field, value: '' })).toBe('');
    expect(formatFieldDisplayValue({ field, value: undefined })).toBe('');
  });
});
