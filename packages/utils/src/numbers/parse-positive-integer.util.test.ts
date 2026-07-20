import { describe, expect, it } from 'vitest';

import { parsePositiveInteger } from './parse-positive-integer.util';

describe('parsePositiveInteger', () => {
  it('parses a valid non-negative integer', () => {
    expect(parsePositiveInteger({ fallback: 50, value: '25' })).toBe(25);
    expect(parsePositiveInteger({ fallback: 50, value: '0' })).toBe(0);
  });

  it('falls back for missing, malformed, fractional, or negative values', () => {
    expect(parsePositiveInteger({ fallback: 50, value: undefined })).toBe(50);
    expect(parsePositiveInteger({ fallback: 50, value: '' })).toBe(50);
    expect(parsePositiveInteger({ fallback: 50, value: 'abc' })).toBe(50);
    expect(parsePositiveInteger({ fallback: 50, value: '12.5' })).toBe(50);
    expect(parsePositiveInteger({ fallback: 50, value: '-5' })).toBe(50);
  });
});
