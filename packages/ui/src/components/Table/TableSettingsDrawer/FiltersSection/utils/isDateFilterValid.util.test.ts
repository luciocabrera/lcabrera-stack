import { describe, expect, it } from 'vite-plus/test';

import { isDateFilterValid } from './isDateFilterValid.util';

describe('isDateFilterValid', () => {
  it('returns false when value is empty', () => {
    expect(
      isDateFilterValid({ operator: 'after', type: 'date', value: '' }),
    ).toBe(false);
  });

  it('returns true when value is present', () => {
    expect(
      isDateFilterValid({
        operator: 'after',
        type: 'date',
        value: '2024-01-01',
      }),
    ).toBe(true);
  });

  it('returns false for between without value2', () => {
    expect(
      isDateFilterValid({
        operator: 'between',
        type: 'date',
        value: '2024-01-01',
      }),
    ).toBe(false);
  });

  it('returns true for between with both values', () => {
    expect(
      isDateFilterValid({
        operator: 'between',
        type: 'date',
        value: '2024-01-01',
        value2: '2024-12-31',
      }),
    ).toBe(true);
  });
});
