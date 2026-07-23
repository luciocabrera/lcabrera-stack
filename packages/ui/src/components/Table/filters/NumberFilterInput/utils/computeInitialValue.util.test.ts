import { describe, expect, it } from 'vite-plus/test';

import { computeInitialValue } from './computeInitialValue.util';

describe('computeInitialValue (number)', () => {
  it('returns empty string when filter is undefined', () => {
    expect(computeInitialValue(undefined)).toBe('');
  });

  it('returns value for between operator', () => {
    expect(
      computeInitialValue({
        operator: 'between',
        type: 'number',
        value: 10,
        value2: 20,
      }),
    ).toBe(10);
  });

  it('returns value for non-between operator', () => {
    expect(
      computeInitialValue({ operator: 'equals', type: 'number', value: 42 }),
    ).toBe(42);
  });

  it('returns empty string when no value set', () => {
    // @ts-expect-error testing edge case
    expect(computeInitialValue({ operator: 'equals', type: 'number' })).toBe(
      '',
    );
  });
});
