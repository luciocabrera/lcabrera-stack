import { describe, expect, it } from 'vite-plus/test';

import { isShallowEqual } from './is-shallow-equal.util';

describe('isShallowEqual', () => {
  it('returns true for identical object references', () => {
    const obj = { a: 1 };
    expect(isShallowEqual({ objA: obj, objB: obj })).toBe(true);
  });

  it('returns true for objects with same keys and values', () => {
    expect(isShallowEqual({ objA: { a: 1, b: 2 }, objB: { a: 1, b: 2 } })).toBe(
      true,
    );
  });

  it('returns false when a value differs', () => {
    expect(isShallowEqual({ objA: { a: 1 }, objB: { a: 2 } })).toBe(false);
  });

  it('returns false when key counts differ', () => {
    expect(isShallowEqual({ objA: { a: 1, b: 2 }, objB: { a: 1 } })).toBe(
      false,
    );
  });

  it('returns false when objB has extra keys', () => {
    expect(isShallowEqual({ objA: { a: 1 }, objB: { a: 1, b: 2 } })).toBe(
      false,
    );
  });

  it('returns false when one arg is undefined', () => {
    expect(isShallowEqual({ objA: { a: 1 }, objB: undefined })).toBe(false);
    expect(isShallowEqual({ objA: undefined, objB: { a: 1 } })).toBe(false);
  });

  it('returns true when both args are undefined', () => {
    expect(isShallowEqual({ objA: undefined, objB: undefined })).toBe(true);
  });

  it('does not recurse — nested objects are compared by reference', () => {
    const inner = { x: 1 };
    expect(isShallowEqual({ objA: { inner }, objB: { inner } })).toBe(true);
    expect(
      isShallowEqual({ objA: { inner: { x: 1 } }, objB: { inner: { x: 1 } } }),
    ).toBe(false);
  });
});
