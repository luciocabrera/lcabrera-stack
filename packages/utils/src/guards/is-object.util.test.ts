import { describe, expect, it } from 'vite-plus/test';

import { isObject } from './is-object.util';

describe('isObject', () => {
  it('returns true for plain objects', () => {
    expect(isObject({})).toBe(true);
    expect(isObject({ a: 1 })).toBe(true);
  });

  it('returns true for arrays (non-null objects)', () => {
    expect(isObject([])).toBe(true);
  });

  it('returns false for null', () => {
    expect(isObject(undefined)).toBe(false);
  });

  it('returns false for primitives', () => {
    expect(isObject('a')).toBe(false);
    expect(isObject(1)).toBe(false);
    expect(isObject(true)).toBe(false);
    expect(isObject(undefined)).toBe(false);
  });
});
