import { describe, expect, it } from 'vite-plus/test';

import { toComparableCellValue } from './toComparableCellValue.util';

describe('toComparableCellValue', () => {
  it('keeps numbers and bigints as they are', () => {
    expect(toComparableCellValue(4)).toBe(4);
    expect(toComparableCellValue(4n)).toBe(4n);
  });

  it('turns a boolean into 0 or 1', () => {
    expect(toComparableCellValue(false)).toBe(0);
    expect(toComparableCellValue(true)).toBe(1);
  });

  it('turns a date into its time', () => {
    expect(toComparableCellValue(new Date(5))).toBe(5);
  });

  it('keeps a string and serialises anything else', () => {
    expect(toComparableCellValue('a')).toBe('a');
    expect(toComparableCellValue({ a: 1 })).toBe('{"a":1}');
  });
});
