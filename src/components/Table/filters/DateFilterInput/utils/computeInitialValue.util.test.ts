import { describe, expect, it } from 'vitest';

import { computeInitialValue } from './computeInitialValue.util';

describe('computeInitialValue (date)', () => {
  it('returns empty string when filter is undefined', () => {
    expect(computeInitialValue(undefined)).toBe('');
  });

  it('returns value for between operator', () => {
    expect(
      computeInitialValue({
        operator: 'between',
        type: 'date',
        value: '2024-01-01',
        value2: '2024-12-31',
      }),
    ).toBe('2024-01-01');
  });

  it('returns value for non-between operator', () => {
    expect(
      computeInitialValue({
        operator: 'after',
        type: 'date',
        value: '2024-06-01',
      }),
    ).toBe('2024-06-01');
  });

  it('returns empty string when no value', () => {
    expect(
      computeInitialValue({ operator: 'after', type: 'date', value: '' }),
    ).toBe('');
  });
});
