import { describe, expect, it } from 'vite-plus/test';

import { resolveNumberOperatorChange } from './resolveNumberOperatorChange.util';

describe('resolveNumberOperatorChange', () => {
  it('seeds an empty number filter when none exists', () => {
    expect(resolveNumberOperatorChange({ operator: 'greaterThan' })).toEqual({
      operator: 'greaterThan',
      type: 'number',
      value: undefined,
    });
  });

  it('keeps the drafted value and the between second value', () => {
    expect(
      resolveNumberOperatorChange({
        filter: { operator: 'between', type: 'number', value: 1, value2: 9 },
        operator: 'lessThan',
      }),
    ).toEqual({ operator: 'lessThan', type: 'number', value: 1, value2: 9 });
  });

  it('rebuilds fresh when the existing filter is not a number filter', () => {
    expect(
      resolveNumberOperatorChange({
        filter: { operator: 'equals', type: 'select', value: 'alpha' },
        operator: 'equals',
      }),
    ).toEqual({ operator: 'equals', type: 'number', value: undefined });
  });
});
