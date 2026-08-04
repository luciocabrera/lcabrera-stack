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

  // Reachable, not an edge case the type forbids: `NumberFilter.value` is
  // `number | undefined` because NumberFilterInput emits `value: undefined`
  // for an empty input, so the state is spelled with the key present.
  it('returns empty string while the value is undefined mid-edit', () => {
    expect(
      computeInitialValue({
        operator: 'equals',
        type: 'number',
        value: undefined,
      }),
    ).toBe('');
  });
});
