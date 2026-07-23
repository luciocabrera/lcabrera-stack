import { describe, expect, it } from 'vite-plus/test';

import { isNumberFilterValid } from './isNumberFilterValid.util';

describe('isNumberFilterValid', () => {
  it('returns false when value is undefined', () => {
    expect(
      isNumberFilterValid({
        operator: 'equals',
        type: 'number',
        value: undefined,
      }),
    ).toBe(false);
  });

  it('returns false when value is NaN', () => {
    expect(
      isNumberFilterValid({
        operator: 'equals',
        type: 'number',
        value: NaN,
      }),
    ).toBe(false);
  });

  it('returns true when value is 0', () => {
    expect(
      isNumberFilterValid({ operator: 'equals', type: 'number', value: 0 }),
    ).toBe(true);
  });

  it('returns false for between where value2 is less than value', () => {
    expect(
      isNumberFilterValid({
        operator: 'between',
        type: 'number',
        value: 10,
        value2: 5,
      }),
    ).toBe(false);
  });

  it('returns false for between where value2 equals value', () => {
    expect(
      isNumberFilterValid({
        operator: 'between',
        type: 'number',
        value: 10,
        value2: 10,
      }),
    ).toBe(false);
  });

  it('returns true for between where value2 is greater than value', () => {
    expect(
      isNumberFilterValid({
        operator: 'between',
        type: 'number',
        value: 5,
        value2: 10,
      }),
    ).toBe(true);
  });
});
