import { describe, expect, it } from 'vitest';

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
});
