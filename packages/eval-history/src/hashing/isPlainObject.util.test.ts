import { describe, expect, it } from 'vite-plus/test';

import { isPlainObject } from './isPlainObject.util.ts';

describe('isPlainObject', () => {
  it('accepts an object literal', () => {
    expect(isPlainObject({ a: 1 })).toBe(true);
  });

  it('rejects arrays, null, primitives and class instances', () => {
    expect(isPlainObject([])).toBe(false);
    expect(isPlainObject(JSON.parse('null'))).toBe(false);
    expect(isPlainObject('a')).toBe(false);
    expect(isPlainObject(new Date(0))).toBe(false);
  });
});
