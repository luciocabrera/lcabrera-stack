import { describe, expect, it } from 'vite-plus/test';

import { areArraysEqual } from './are-arrays-equal.util';

describe('areArraysEqual', () => {
  it('returns true for identical array references', () => {
    const values = ['a', 'b'];
    expect(areArraysEqual({ left: values, right: values })).toBe(true);
  });

  it('returns true for arrays with same values in same order', () => {
    expect(areArraysEqual({ left: ['a', 'b'], right: ['a', 'b'] })).toBe(true);
  });

  it('returns false for arrays with same values in different order', () => {
    expect(areArraysEqual({ left: ['a', 'b'], right: ['b', 'a'] })).toBe(false);
  });

  it('returns false when one array is undefined', () => {
    expect(areArraysEqual({ left: ['a'], right: undefined })).toBe(false);
    expect(areArraysEqual({ left: undefined, right: ['a'] })).toBe(false);
  });

  it('returns true when both arrays are undefined', () => {
    expect(areArraysEqual<string>({ left: undefined, right: undefined })).toBe(
      true,
    );
  });

  it('returns false when lengths differ', () => {
    expect(areArraysEqual({ left: ['a'], right: ['a', 'b'] })).toBe(false);
  });
});
