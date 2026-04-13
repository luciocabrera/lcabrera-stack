import { describe, expect, it } from 'vitest';

import { shallowEqual } from './shallowEqual.util.ts';

describe('shallowEqual', () => {
  it('returns true for identical object references', () => {
    const obj = { a: 1 };
    expect(shallowEqual({ objA: obj, objB: obj })).toBe(true);
  });

  it('returns true for objects with same keys and values', () => {
    expect(shallowEqual({ objA: { a: 1, b: 2 }, objB: { a: 1, b: 2 } })).toBe(
      true,
    );
  });

  it('returns false when a value differs', () => {
    expect(shallowEqual({ objA: { a: 1 }, objB: { a: 2 } })).toBe(false);
  });

  it('returns false when key counts differ', () => {
    expect(shallowEqual({ objA: { a: 1, b: 2 }, objB: { a: 1 } })).toBe(false);
  });

  it('returns false when objB has extra keys', () => {
    expect(shallowEqual({ objA: { a: 1 }, objB: { a: 1, b: 2 } })).toBe(false);
  });

  it('returns false when one arg is undefined', () => {
    expect(shallowEqual({ objA: { a: 1 }, objB: undefined })).toBe(false);
    expect(shallowEqual({ objA: undefined, objB: { a: 1 } })).toBe(false);
  });

  it('returns true when both args are undefined', () => {
    expect(shallowEqual({ objA: undefined, objB: undefined })).toBe(true);
  });

  it('does not recurse — nested objects are compared by reference', () => {
    const inner = { x: 1 };
    expect(shallowEqual({ objA: { inner }, objB: { inner } })).toBe(true);
    expect(
      shallowEqual({ objA: { inner: { x: 1 } }, objB: { inner: { x: 1 } } }),
    ).toBe(false);
  });
});
