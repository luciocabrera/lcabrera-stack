import { describe, expect, it } from 'vite-plus/test';

import { resolveTextOperatorChange } from './resolveTextOperatorChange.util';

describe('resolveTextOperatorChange', () => {
  it('seeds an empty text filter when none exists', () => {
    expect(resolveTextOperatorChange({ operator: 'startsWith' })).toEqual({
      operator: 'startsWith',
      type: 'text',
      value: '',
    });
  });

  it('keeps a text filter value and swaps the operator', () => {
    expect(
      resolveTextOperatorChange({
        filter: { operator: 'equals', type: 'text', value: 'cancelled' },
        operator: 'contains',
      }),
    ).toEqual({ operator: 'contains', type: 'text', value: 'cancelled' });
  });

  it('keeps a select filter on the operators a select can model', () => {
    expect(
      resolveTextOperatorChange({
        filter: { operator: 'equals', type: 'select', values: ['alpha'] },
        operator: 'notEquals',
      }),
    ).toEqual({ operator: 'notEquals', type: 'select', values: ['alpha'] });
  });

  it('converts a select filter to text when the operator leaves equals/notEquals', () => {
    expect(
      resolveTextOperatorChange({
        filter: { operator: 'equals', type: 'select', values: ['alpha'] },
        operator: 'contains',
      }),
    ).toEqual({ operator: 'contains', type: 'text', value: 'alpha' });
  });
});
