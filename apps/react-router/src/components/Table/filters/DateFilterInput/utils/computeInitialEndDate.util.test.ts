import { describe, expect, it } from 'vitest';

import { computeInitialEndDate } from './computeInitialEndDate.util.ts';

describe('computeInitialEndDate', () => {
  it('returns empty string when filter is undefined', () => {
    expect(computeInitialEndDate(undefined)).toBe('');
  });

  it('returns value2 for between operator', () => {
    expect(
      computeInitialEndDate({
        operator: 'between',
        type: 'date',
        value: '2024-01-01',
        value2: '2024-12-31',
      }),
    ).toBe('2024-12-31');
  });

  it('returns empty string for between operator without value2', () => {
    expect(
      computeInitialEndDate({
        operator: 'between',
        type: 'date',
        value: '2024-01-01',
      }),
    ).toBe('');
  });

  it('returns empty string for non-between operator', () => {
    expect(
      computeInitialEndDate({
        operator: 'after',
        type: 'date',
        value: '2024-01-01',
      }),
    ).toBe('');
  });
});
