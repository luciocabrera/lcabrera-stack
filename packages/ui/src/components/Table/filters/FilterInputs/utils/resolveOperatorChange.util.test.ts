import { describe, expect, it } from 'vite-plus/test';

import { resolveOperatorChange } from './resolveOperatorChange.util';

describe('resolveOperatorChange', () => {
  it('keeps the existing filter value and swaps the operator', () => {
    expect(
      resolveOperatorChange({
        dataType: 'string',
        filter: { operator: 'equals', type: 'text', value: 'cancelled' },
        operator: 'contains',
      }),
    ).toEqual({ operator: 'contains', type: 'text', value: 'cancelled' });
  });

  it('seeds an empty number filter for number columns', () => {
    expect(
      resolveOperatorChange({ dataType: 'number', operator: 'greaterThan' }),
    ).toEqual({ operator: 'greaterThan', type: 'number', value: undefined });
  });

  it('seeds an empty number filter for currency columns', () => {
    expect(
      resolveOperatorChange({ dataType: 'currency', operator: 'lessThan' }),
    ).toEqual({ operator: 'lessThan', type: 'number', value: undefined });
  });

  it('seeds an empty date filter for date columns', () => {
    expect(
      resolveOperatorChange({ dataType: 'date', operator: 'before' }),
    ).toEqual({ operator: 'before', type: 'date', value: '' });
  });

  it('seeds an empty text filter for string columns', () => {
    expect(
      resolveOperatorChange({ dataType: 'string', operator: 'startsWith' }),
    ).toEqual({ operator: 'startsWith', type: 'text', value: '' });
  });

  it('keeps a select filter on the operators a select can model', () => {
    expect(
      resolveOperatorChange({
        dataType: 'string',
        filter: { operator: 'equals', type: 'select', values: ['alpha'] },
        operator: 'notEquals',
      }),
    ).toEqual({ operator: 'notEquals', type: 'select', values: ['alpha'] });
  });

  // Regression: this used to return `{ type: 'select', operator: 'contains' }`,
  // which SelectFilter's operator does not model. serializeSelectFilter then
  // matched neither 'notEquals' nor a text path, so the stale selected values
  // kept filtering as `equals` behind the text input the UI had swapped in.
  it('converts a select filter to text when the operator leaves equals/notEquals', () => {
    expect(
      resolveOperatorChange({
        dataType: 'string',
        filter: { operator: 'equals', type: 'select', values: ['alpha'] },
        operator: 'contains',
      }),
    ).toEqual({ operator: 'contains', type: 'text', value: 'alpha' });
  });

  it('carries a single-select value across the conversion', () => {
    expect(
      resolveOperatorChange({
        dataType: 'string',
        filter: { type: 'select', value: 'beta' },
        operator: 'startsWith',
      }),
    ).toEqual({ operator: 'startsWith', type: 'text', value: 'beta' });
  });

  it('converts an empty multi-select to an empty text filter', () => {
    expect(
      resolveOperatorChange({
        dataType: 'string',
        filter: { type: 'multiSelect', values: [] },
        operator: 'endsWith',
      }),
    ).toEqual({ operator: 'endsWith', type: 'text', value: '' });
  });

  it('preserves the second value when swapping between number operators', () => {
    expect(
      resolveOperatorChange({
        dataType: 'number',
        filter: { operator: 'between', type: 'number', value: 1, value2: 9 },
        operator: 'greaterThan',
      }),
    ).toEqual({
      operator: 'greaterThan',
      type: 'number',
      value: 1,
      value2: 9,
    });
  });

  it('rebuilds a fresh typed filter when the existing filter does not match the column', () => {
    expect(
      resolveOperatorChange({
        dataType: 'number',
        filter: { operator: 'equals', type: 'select', value: 'alpha' },
        operator: 'lessThan',
      }),
    ).toEqual({ operator: 'lessThan', type: 'number', value: undefined });
  });
});
